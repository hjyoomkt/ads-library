import { supabase } from '../config/supabase';

// Export supabase client for direct use in components
export { supabase };

/**
 * 광고 목록 조회 (필터링, 페이징)
 * 백엔드 adsRoutes.js (17-53줄) 로직 이식
 */
export async function getAds(filters = {}) {
  try {
    const {
      search,
      advertiser,
      platform,
      searchQueries,
      page = 1,
      limit = 20
    } = filters;

    let query = supabase
      .from('ad_archives')
      .select(`
        *,
        ad_media (*)
      `, { count: 'exact' })
      .order('scraped_at', { ascending: false });

    // 여러 검색 쿼리로 필터링 (사용자가 검색했던 쿼리들)
    if (searchQueries && Array.isArray(searchQueries) && searchQueries.length > 0) {
      const orConditions = searchQueries
        .map(q => `search_query.eq.${q}`)
        .join(',');
      query = query.or(orConditions);
    } else if (search) {
      // 단일 검색어로 필터링
      query = query.or(`search_query.ilike.%${search}%,ad_creative_body.ilike.%${search}%`);
    }

    if (advertiser) {
      query = query.ilike('advertiser_name', `%${advertiser}%`);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      ads: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error('getAds error:', error);
    throw error;
  }
}

/**
 * 광고 상세 조회
 * 백엔드 adsRoutes.js (107-133줄) 로직 이식
 */
export async function getAdById(id) {
  try {
    const { data, error } = await supabase
      .from('ad_archives')
      .select(`
        *,
        ad_media (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('Ad not found');
    }

    return data;
  } catch (error) {
    console.error('getAdById error:', error);
    throw error;
  }
}

/**
 * 광고 삭제
 * 백엔드 adsRoutes.js (135-153줄) 로직 이식
 */
export async function deleteAd(id) {
  try {
    const { error } = await supabase
      .from('ad_archives')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('deleteAd error:', error);
    throw error;
  }
}

/**
 * 검색 히스토리 조회
 * 백엔드 searchHistoryRoutes.js (8-71줄) 로직 이식
 */
export async function getSearchHistory() {
  try {
    // user_search_history에서 고유한 검색어 목록 가져오기
    const { data: searchHistory, error: historyError } = await supabase
      .from('user_search_history')
      .select('search_type, search_query, created_at')
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    // 고유한 검색어로 그룹화 (search_type + search_query 조합)
    const uniqueSearchesMap = new Map();

    for (const item of searchHistory || []) {
      const key = `${item.search_type}:${item.search_query}`;
      if (!uniqueSearchesMap.has(key)) {
        uniqueSearchesMap.set(key, {
          search_type: item.search_type,
          search_query: item.search_query,
          last_searched_at: item.created_at,
          search_count: 1
        });
      } else {
        const existing = uniqueSearchesMap.get(key);
        existing.search_count += 1;
        // 가장 최근 검색 시간 유지
        if (new Date(item.created_at) > new Date(existing.last_searched_at)) {
          existing.last_searched_at = item.created_at;
        }
      }
    }

    const uniqueSearches = Array.from(uniqueSearchesMap.values());

    // 각 검색어에 대한 광고 수 계산
    for (const search of uniqueSearches) {
      const { count, error: countError } = await supabase
        .from('ad_archives')
        .select('*', { count: 'exact', head: true })
        .eq('search_type', search.search_type)
        .eq('search_query', search.search_query);

      if (!countError) {
        search.total_ads_count = count || 0;
      } else {
        search.total_ads_count = 0;
      }
    }

    // 최근 검색 순으로 정렬
    uniqueSearches.sort((a, b) =>
      new Date(b.last_searched_at) - new Date(a.last_searched_at)
    );

    return uniqueSearches;
  } catch (error) {
    console.error('getSearchHistory error:', error);
    throw error;
  }
}

/**
 * 작업 목록 조회
 * 백엔드 jobRoutes.js (58-77줄) 로직 이식
 */
export async function getJobs(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getJobs error:', error);
    throw error;
  }
}

/**
 * 검색 히스토리 저장 (UPSERT 방식)
 * @param {string} searchType - 'keyword' or 'advertiser'
 * @param {string} searchQuery - 검색어
 * @param {string} advertiserId - 현재 선택된 브랜드 ID
 */
export async function saveSearchHistory(searchType, searchQuery, advertiserId) {
  try {
    if (!advertiserId) {
      console.warn('No advertiser ID provided - search history not saved');
      return null;
    }

    const { data, error } = await supabase
      .from('user_search_history')
      .insert({
        search_type: searchType,
        search_query: searchQuery,
        advertiser_id: advertiserId
      })
      .select()
      .single();

    if (error) {
      // 중복 에러는 무시 (이미 북마크됨)
      if (error.code === '23505') {
        console.log('Search already bookmarked');
        return null;
      }
      console.error('Failed to save search history:', error);
      throw error;
    }

    console.log('✅ Search history saved:', { searchType, searchQuery, advertiserId: advertiserId.slice(0, 8) });
    return data;
  } catch (error) {
    console.error('saveSearchHistory error:', error);
    throw error;
  }
}

/**
 * Get all users
 * @param {Object} currentUser - Current user with role, organization_id, advertiser_id
 */
export async function getUsers(currentUser = null) {
  try {
    let query = supabase
      .from('users')
      .select(`
        *,
        organizations(id, name, type),
        advertisers(id, name)
      `)
      .is('deleted_at', null);

    // Filter by role
    if (currentUser && currentUser.role !== 'master') {
      // Agency admin/manager: filter by organization
      if (['agency_admin', 'agency_manager'].includes(currentUser.role) && currentUser.organization_id) {
        query = query.eq('organization_id', currentUser.organization_id);
      }
      // Advertiser admin/staff: filter by advertiser
      else if (['advertiser_admin', 'advertiser_staff', 'brand_admin'].includes(currentUser.role) && currentUser.advertiser_id) {
        query = query.eq('advertiser_id', currentUser.advertiser_id);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getUsers error:', error);
    throw error;
  }
}

/**
 * Get user statistics
 * @param {Object} currentUser - Current user with role and organization_id
 */
export async function getUserStats(currentUser = null) {
  try {
    // Get all users with their role and status
    let query = supabase
      .from('users')
      .select('role, status, organization_id')
      .is('deleted_at', null);

    // Filter by organization if not master
    if (currentUser && currentUser.role !== 'master' && currentUser.organization_id) {
      query = query.eq('organization_id', currentUser.organization_id);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => u.status === 'active').length || 0;
    const adminUsers = users?.filter(u =>
      ['master', 'agency_admin', 'agency_manager', 'advertiser_admin', 'advertiser_staff'].includes(u.role)
    ).length || 0;

    return {
      totalUsers,
      activeUsers,
      adminUsers,
    };
  } catch (error) {
    console.error('getUserStats error:', error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId, newRole) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('updateUserRole error:', error);
    throw error;
  }
}

/**
 * Delete brand (advertiser)
 */
export async function deleteBrand(brandId, brandName) {
  try {
    console.log('[deleteBrand] 삭제 시작:', { brandId, brandName });

    // 1. 브랜드 전용 사용자 목록 조회 (에이전시 직원 제외)
    const { data: usersToDelete, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('advertiser_id', brandId)
      .not('role', 'in', '(master,agency_staff,agency_admin,agency_manager)');

    if (usersError) {
      console.error('[deleteBrand] 사용자 조회 실패:', usersError);
      throw usersError;
    }

    console.log('[deleteBrand] 삭제할 사용자:', usersToDelete?.length || 0, usersToDelete);

    // 2. 브랜드 삭제 (RLS 정책 통과를 위해 사용자 삭제 전에!)
    const { data: deleteData, error: deleteError } = await supabase
      .from('advertisers')
      .delete()
      .eq('id', brandId);

    if (deleteError) {
      console.error('[deleteBrand] ✗ 브랜드 삭제 실패:', deleteError);
      throw new Error(`브랜드 삭제 실패: ${deleteError.message}`);
    }

    console.log('[deleteBrand] ✓ 브랜드 삭제 완료');

    // 3. 사용자들 삭제 (delete-user Edge Function 사용)
    const { data: { session } } = await supabase.auth.getSession();

    let deletedUsers = [];
    let failedUsers = [];

    if (!session) {
      console.warn('[deleteBrand] ⚠️ 세션 없음 - 사용자 삭제 건너뜀');
    } else if (usersToDelete && usersToDelete.length > 0) {
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
      const functionUrl = `${SUPABASE_URL}/functions/v1/delete-user`;

      // 현재 로그인한 사용자를 마지막에 삭제하기 위해 순서 조정
      const currentUserId = session.user.id;
      const otherUsers = usersToDelete.filter(u => u.id !== currentUserId);
      const currentUser = usersToDelete.find(u => u.id === currentUserId);
      const orderedUsers = currentUser ? [...otherUsers, currentUser] : usersToDelete;

      console.log('[deleteBrand] 삭제 순서:', orderedUsers.map(u => `${u.email} ${u.id === currentUserId ? '(현재 사용자)' : ''}`));

      for (const user of orderedUsers) {
        try {
          console.log(`[deleteBrand] 사용자 삭제 중: ${user.email}`);

          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              is_brand_deletion: true
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error(`[deleteBrand] ✗ ${user.email} 삭제 실패:`, result);
            failedUsers.push(user.email);
          } else {
            console.log(`[deleteBrand] ✓ ${user.email} 삭제 완료`);
            deletedUsers.push(user.email);
          }
        } catch (fetchError) {
          console.error(`[deleteBrand] ✗ ${user.email} 삭제 실패:`, fetchError);
          failedUsers.push(user.email);
        }
      }
    }

    console.log('[deleteBrand] 삭제 완료:', {
      brand: brandName,
      deletedUsers: deletedUsers.length,
      users: deletedUsers,
      failedUsers: failedUsers.length
    });

    return {
      success: true,
      deletedUsers,
      failedUsers
    };
  } catch (error) {
    console.error('[deleteBrand] 오류:', error);
    throw error;
  }
}

/**
 * Check if user can delete brand
 */
export async function canDeleteBrand(userId, brandId) {
  try {
    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, advertiser_id, organization_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // master는 무조건 삭제 가능
    if (userData.role === 'master') {
      return { canDelete: true };
    }

    // agency_admin: 자신의 조직에 속한 브랜드만
    if (userData.role === 'agency_admin') {
      const { data: brandData, error: brandError } = await supabase
        .from('advertisers')
        .select('organization_id')
        .eq('id', brandId)
        .single();

      if (brandError) throw brandError;

      if (brandData.organization_id === userData.organization_id) {
        return { canDelete: true };
      } else {
        return {
          canDelete: false,
          reason: '다른 조직의 브랜드는 삭제할 수 없습니다.'
        };
      }
    }

    // advertiser_admin: 자신의 브랜드만
    if (userData.role === 'advertiser_admin') {
      if (userData.advertiser_id === brandId) {
        return { canDelete: true };
      } else {
        return {
          canDelete: false,
          reason: '다른 브랜드는 삭제할 수 없습니다.'
        };
      }
    }

    return {
      canDelete: false,
      reason: '브랜드를 삭제할 권한이 없습니다.'
    };
  } catch (error) {
    console.error('canDeleteBrand error:', error);
    throw error;
  }
}

/**
 * Delete agency (organization)
 */
export async function deleteAgency(organizationId, organizationName) {
  try {
    console.log('[deleteAgency] 삭제 시작:', { organizationId, organizationName });

    // 1. 조직 정보 조회
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        advertisers (
          id,
          name
        )
      `)
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('[deleteAgency] 조직 조회 실패:', orgError);
      throw orgError;
    }

    console.log('[deleteAgency] 조직 정보:', orgData);
    console.log('[deleteAgency] 소속 브랜드 수:', orgData.advertisers?.length || 0);

    // 2. 소속 브랜드 모두 삭제
    let deletedBrands = [];
    let failedBrands = [];

    if (orgData.advertisers && orgData.advertisers.length > 0) {
      for (const brand of orgData.advertisers) {
        try {
          console.log(`[deleteAgency] 브랜드 삭제 중: ${brand.name}`);

          // deleteBrand 함수 재사용 (브랜드 전용 사용자 삭제 + 에이전시 직원 보호)
          await deleteBrand(brand.id, brand.name);

          deletedBrands.push(brand.name);
          console.log(`[deleteAgency] ✓ 브랜드 삭제 완료: ${brand.name}`);
        } catch (error) {
          console.error(`[deleteAgency] ✗ 브랜드 삭제 실패: ${brand.name}`, error);
          failedBrands.push(brand.name);
        }
      }
    }

    console.log('[deleteAgency] 브랜드 삭제 완료:', {
      total: orgData.advertisers?.length || 0,
      success: deletedBrands.length,
      failed: failedBrands.length
    });

    // 3. 에이전시 직원 목록 조회
    const { data: usersToDelete, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('organization_id', organizationId);

    if (usersError) {
      console.error('[deleteAgency] 직원 조회 실패:', usersError);
      throw usersError;
    }

    console.log('[deleteAgency] 삭제할 직원:', usersToDelete?.length || 0, usersToDelete);

    // 4. 에이전시 직원 삭제 (현재 사용자 제외)
    const { data: { session } } = await supabase.auth.getSession();

    let deletedUsers = [];
    let failedUsers = [];

    if (!session) {
      console.warn('[deleteAgency] ⚠️ 세션 없음 - 직원 삭제 건너뜀');
    } else if (usersToDelete && usersToDelete.length > 0) {
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
      const functionUrl = `${SUPABASE_URL}/functions/v1/delete-user`;

      // 현재 로그인한 사용자 제외 (조직 삭제 시 CASCADE로 자동 삭제됨)
      const currentUserId = session.user.id;
      const otherUsers = usersToDelete.filter(u => u.id !== currentUserId);

      console.log('[deleteAgency] 삭제할 직원 (현재 사용자 제외):', otherUsers.map(u => u.email));
      console.log('[deleteAgency] 현재 사용자는 조직 삭제 시 CASCADE로 자동 삭제됨:', session.user.email);

      for (const user of otherUsers) {
        try {
          console.log(`[deleteAgency] 직원 삭제 중: ${user.email}`);

          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              is_agency_deletion: false
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error(`[deleteAgency] ✗ ${user.email} 삭제 실패:`, result);
            failedUsers.push(user.email);
          } else {
            console.log(`[deleteAgency] ✓ ${user.email} 삭제 완료`);
            deletedUsers.push(user.email);
          }
        } catch (fetchError) {
          console.error(`[deleteAgency] ✗ ${user.email} 삭제 실패:`, fetchError);
          failedUsers.push(user.email);
        }
      }
    }

    console.log('[deleteAgency] 직원 삭제 완료 (현재 사용자 제외):', {
      total: usersToDelete?.length || 0,
      otherUsersDeleted: deletedUsers.length,
      failed: failedUsers.length
    });

    // 5. 조직 삭제 (CASCADE DELETE로 users 테이블에서 현재 사용자도 삭제됨)
    console.log('[deleteAgency] 조직 삭제 시작 (CASCADE로 현재 사용자의 users 레코드도 삭제됨)');
    const { error: deleteOrgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (deleteOrgError) {
      console.error('[deleteAgency] ✗ 조직 삭제 실패:', deleteOrgError);
      throw new Error(`조직 삭제 실패: ${deleteOrgError.message}`);
    }

    console.log('[deleteAgency] ✓ 조직 삭제 완료');

    // 6. 현재 사용자 auth.users에서 삭제 (조직 이미 삭제되었으므로 is_agency_deletion: true)
    if (session) {
      const currentUserId = session.user.id;
      const currentUserEmail = session.user.email;

      console.log(`[deleteAgency] 현재 사용자 auth.users 삭제 시작: ${currentUserEmail}`);

      try {
        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
        const functionUrl = `${SUPABASE_URL}/functions/v1/delete-user`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUserId,
            is_agency_deletion: true  // 조직 이미 삭제됨, 권한 체크 건너뛰기
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(`[deleteAgency] ✗ 현재 사용자 삭제 실패:`, result);
        } else {
          console.log(`[deleteAgency] ✓ 현재 사용자 삭제 완료: ${currentUserEmail}`);
        }
      } catch (fetchError) {
        console.error(`[deleteAgency] ✗ 현재 사용자 삭제 실패:`, fetchError);
      }
    }

    console.log('[deleteAgency] 삭제 완료:', {
      organization: organizationName,
      deletedBrands: deletedBrands.length,
      failedBrands: failedBrands.length,
      deletedUsers: deletedUsers.length,
      failedUsers: failedUsers.length
    });

    return {
      success: true,
      deletedBrands,
      failedBrands,
      deletedUsers,
      failedUsers
    };
  } catch (error) {
    console.error('[deleteAgency] 오류:', error);
    throw error;
  }
}

/**
 * Send agency deletion verification email
 */
export async function sendAgencyDeletionEmail(organizationId, organizationName) {
  try {
    console.log('[sendAgencyDeletionEmail] 이메일 발송 시작:', { organizationId, organizationName });

    const { data, error } = await supabase.functions.invoke('send-agency-deletion-email', {
      body: {
        organization_id: organizationId,
        organization_name: organizationName
      }
    });

    if (error) {
      console.error('[sendAgencyDeletionEmail] 에러:', error);
      throw error;
    }

    console.log('[sendAgencyDeletionEmail] 발송 완료:', data);
    return data;
  } catch (error) {
    console.error('[sendAgencyDeletionEmail] 예외 발생:', error);
    throw error;
  }
}

/**
 * Verify agency deletion code
 */
export async function verifyAgencyDeletionCode(code, organizationId) {
  try {
    console.log('[verifyAgencyDeletionCode] 코드 검증 시작:', { code, organizationId });

    const { data, error } = await supabase
      .from('agency_deletion_codes')
      .select('*')
      .eq('code', code)
      .eq('organization_id', organizationId)
      .is('used_at', null)
      .single();

    if (error) {
      console.error('[verifyAgencyDeletionCode] 조회 에러:', error);
      return { valid: false, reason: '유효하지 않은 코드입니다.' };
    }

    if (!data) {
      return { valid: false, reason: '코드를 찾을 수 없습니다.' };
    }

    // 만료 확인
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return { valid: false, reason: '코드가 만료되었습니다. 새 코드를 발급받으세요.' };
    }

    // 사용 처리
    const { error: updateError } = await supabase
      .from('agency_deletion_codes')
      .update({ used_at: now.toISOString() })
      .eq('id', data.id);

    if (updateError) {
      console.error('[verifyAgencyDeletionCode] 사용 처리 실패:', updateError);
      return { valid: false, reason: '코드 처리 중 오류가 발생했습니다.' };
    }

    console.log('[verifyAgencyDeletionCode] 검증 완료');
    return { valid: true };
  } catch (error) {
    console.error('[verifyAgencyDeletionCode] 예외 발생:', error);
    return { valid: false, reason: '코드 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * Create invitation code
 */
export async function createInviteCode(inviteData) {
  try {
    // Generate random invitation code
    const code = inviteData.code || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Generate expiration date (7 days from now)
    const expiresAt = inviteData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Convert camelCase to snake_case for Supabase
    const dbData = {
      code: code,
      organization_id: inviteData.organizationId,
      advertiser_id: inviteData.advertiserId,
      advertiser_ids: inviteData.advertiserIds,
      invited_email: inviteData.email,
      role: inviteData.role,
      created_by: inviteData.createdBy,
      expires_at: expiresAt,
      invite_type: inviteData.inviteType,
      parent_advertiser_id: inviteData.parentAdvertiserId,
    };

    const { data, error } = await supabase
      .from('invitation_codes')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    // Edge Function 호출하여 초대 이메일 발송
    try {
      await sendInviteEmail({
        inviteCode: data.code,
        invitedEmail: inviteData.email,
        inviteType: inviteData.inviteType || 'existing_member',
      });
      console.log('Invite email sent successfully to:', inviteData.email);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // 이메일 발송 실패해도 초대 코드는 정상 반환
    }

    return { success: true, code: data.code, data };
  } catch (error) {
    console.error('createInviteCode error:', error);
    throw error;
  }
}

/**
 * Edge Function을 통해 초대 이메일 발송
 */
export async function sendInviteEmail(emailData) {
  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: emailData,
  });
  if (error) throw error;
  return data;
}

/**
 * Update user status
 */
export async function updateUserStatus(userId, status) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('updateUserStatus error:', error);
    throw error;
  }
}

/**
 * Log changelog (no-op for now, since changelog feature is removed)
 */
export async function logChangelog() {
  // Changelog feature removed, no-op
  return { success: true };
}

/**
 * Get brand users for transfer (when deleting a user)
 */
export async function getBrandUsersForTransfer(brandId, excludeUserId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('advertiser_id', brandId)
      .neq('id', excludeUserId)
      .is('deleted_at', null);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getBrandUsersForTransfer error:', error);
    throw error;
  }
}

/**
 * Delete user account via Edge Function
 * auth.users 삭제, 이메일 익명화, 감사 로그, 소유권 이전 등 전체 처리
 * @param {string} userId - 삭제할 사용자 UUID
 * @param {string|null} newOwnerId - 소유권 이전 대상 UUID (advertiser_admin인 경우 필수)
 */
export async function deleteUserAccount(userId, newOwnerId = null) {
  console.log('[deleteUserAccount] 삭제 시작:', { userId, newOwnerId });

  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: {
        user_id: userId,
        new_owner_id: newOwnerId
      }
    });

    if (error) {
      console.error('[deleteUserAccount] 에러:', error);
      throw error;
    }

    console.log('[deleteUserAccount] 삭제 완료:', data);
    return data;
  } catch (error) {
    console.error('[deleteUserAccount] 예외 발생:', error);
    throw error;
  }
}

/**
 * Update user role and advertisers
 * In ads-library, we only use users.advertiser_id (no user_advertisers table)
 */
export async function updateUserRoleAndAdvertisers(userId, role, advertiserId, organizationId = null) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        role,
        advertiser_id: advertiserId,
        organization_id: organizationId,
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('updateUserRoleAndAdvertisers error:', error);
    throw error;
  }
}

/**
 * 인기 검색어 조회 (ad_archives에서 직접 집계)
 * Monitoring 페이지에서 추천 경쟁사로 표시
 * RLS 정책 영향 없이 서버에 저장된 모든 검색어 목록 조회
 */
export async function getPopularSearches(limit = 20) {
  try {
    // ad_archives 테이블에서 모든 검색어 가져오기 (RLS 영향 없음)
    const { data: allAds, error: adsError } = await supabase
      .from('ad_archives')
      .select('search_type, search_query, scraped_at')
      .not('search_query', 'is', null)
      .not('search_type', 'is', null)
      .order('scraped_at', { ascending: false });

    if (adsError) throw adsError;

    console.log('🔍 [getPopularSearches] ad_archives에서 조회된 광고 수:', allAds?.length);

    // 검색어별로 그룹화 및 집계
    const searchMap = new Map();

    for (const ad of allAds || []) {
      const key = `${ad.search_type}:${ad.search_query}`;

      if (!searchMap.has(key)) {
        searchMap.set(key, {
          search_type: ad.search_type,
          search_query: ad.search_query,
          ad_count: 1,
          last_scraped_at: ad.scraped_at
        });
      } else {
        const existing = searchMap.get(key);
        existing.ad_count += 1;

        // 가장 최근 스크래핑 시간 유지
        if (new Date(ad.scraped_at) > new Date(existing.last_scraped_at)) {
          existing.last_scraped_at = ad.scraped_at;
        }
      }
    }

    console.log('🔍 [getPopularSearches] 고유 검색어 수:', searchMap.size);

    // Map을 배열로 변환하고 광고 수로 정렬
    const popularSearches = Array.from(searchMap.values())
      .map(search => ({
        search_type: search.search_type,
        search_query: search.search_query,
        total_ads_count: search.ad_count,
        last_searched_at: search.last_scraped_at,
        search_count: search.ad_count, // 광고 수를 검색 횟수로 사용
        unique_users_count: Math.ceil(search.ad_count / 10), // 광고 10개당 1명으로 추정
        popularity_score: search.ad_count // 광고 수가 인기도
      }))
      .sort((a, b) => b.popularity_score - a.popularity_score);

    console.log('🔍 [getPopularSearches] 상위 5개 검색어:', popularSearches.slice(0, 5).map(s => ({
      query: s.search_query,
      ads: s.total_ads_count
    })));

    // 상위 N개만 선택
    const topSearches = popularSearches.slice(0, limit);

    return topSearches;
  } catch (error) {
    console.error('getPopularSearches error:', error);
    throw error;
  }
}
