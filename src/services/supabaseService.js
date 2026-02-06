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
      .select('*')
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
export async function deleteBrand(brandId) {
  try {
    const { error } = await supabase
      .from('advertisers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', brandId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('deleteBrand error:', error);
    throw error;
  }
}

/**
 * Delete agency (organization)
 */
export async function deleteAgency(agencyId) {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', agencyId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('deleteAgency error:', error);
    throw error;
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

    return { success: true, code: data.code, data };
  } catch (error) {
    console.error('createInviteCode error:', error);
    throw error;
  }
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
 * Delete user account
 */
export async function deleteUserAccount(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('deleteUserAccount error:', error);
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
 * 인기 검색어 조회 (모든 사용자의 검색 기록 집계)
 * Monitoring 페이지에서 추천 경쟁사로 표시
 */
export async function getPopularSearches(limit = 20) {
  try {
    // 모든 사용자의 검색 히스토리 가져오기
    const { data: searchHistory, error: historyError } = await supabase
      .from('user_search_history')
      .select('search_type, search_query, created_at, advertiser_id')
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    // 디버깅: 실제 조회된 데이터 확인
    console.log('🔍 [getPopularSearches] 조회된 검색 기록 수:', searchHistory?.length);
    console.log('🔍 [getPopularSearches] 고유 advertiser_id 수:', new Set(searchHistory?.map(s => s.advertiser_id)).size);
    console.log('🔍 [getPopularSearches] 샘플 데이터:', searchHistory?.slice(0, 3));

    // 검색어별로 그룹화 및 집계
    const searchMap = new Map();

    for (const item of searchHistory || []) {
      const key = `${item.search_type}:${item.search_query}`;

      if (!searchMap.has(key)) {
        searchMap.set(key, {
          search_type: item.search_type,
          search_query: item.search_query,
          search_count: 1,
          last_searched_at: item.created_at,
          unique_users: new Set([item.advertiser_id])
        });
      } else {
        const existing = searchMap.get(key);
        existing.search_count += 1;
        existing.unique_users.add(item.advertiser_id);

        // 가장 최근 검색 시간 유지
        if (new Date(item.created_at) > new Date(existing.last_searched_at)) {
          existing.last_searched_at = item.created_at;
        }
      }
    }

    // Map을 배열로 변환
    const popularSearches = Array.from(searchMap.values()).map(search => ({
      search_type: search.search_type,
      search_query: search.search_query,
      search_count: search.search_count,
      unique_users_count: search.unique_users.size,
      last_searched_at: search.last_searched_at,
      popularity_score: search.search_count * 0.6 + search.unique_users.size * 0.4 // 검색 횟수 + 사용자 수
    }));

    // 인기도 순으로 정렬
    popularSearches.sort((a, b) => b.popularity_score - a.popularity_score);

    // 상위 N개만 선택
    const topSearches = popularSearches.slice(0, limit);

    // 각 검색어의 광고 수 계산
    for (const search of topSearches) {
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

    // 광고가 있는 검색어만 필터링
    const searchesWithAds = topSearches.filter(s => s.total_ads_count > 0);

    return searchesWithAds;
  } catch (error) {
    console.error('getPopularSearches error:', error);
    throw error;
  }
}
