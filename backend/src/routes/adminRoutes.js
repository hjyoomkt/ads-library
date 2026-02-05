import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 권한 체크 헬퍼 함수
function canInvite(role) {
  return ['master', 'agency_admin', 'agency_manager', 'advertiser_admin', 'advertiser_staff'].includes(role);
}

function isMaster(role) {
  return role === 'master';
}

function canAccessSuperAdmin(role) {
  return ['master', 'agency_admin', 'agency_manager'].includes(role);
}

// ============================================
// 초대 코드 생성
// ============================================
router.post('/invitations/create', requireAuth, async (req, res) => {
  try {
    if (!canInvite(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create invitations' });
    }

    const {
      email,
      role,
      organizationId,
      advertiserId,
      advertiserIds,
      inviteType,
      parentAdvertiserId
    } = req.body;

    // new_agency는 master만 가능
    if (inviteType === 'new_agency' && !isMaster(req.user.role)) {
      return res.status(403).json({ error: 'Only master can invite new agencies' });
    }

    // 초대 코드 생성
    const code = `INVITE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    // 브랜드 이름 조회 (advertiserIds가 있는 경우)
    let advertiserNames = null;
    if (advertiserIds && advertiserIds.length > 0) {
      const { data: brandsData } = await supabase
        .from('advertisers')
        .select('id, name')
        .in('id', advertiserIds);

      if (brandsData) {
        const brandsMap = new Map(brandsData.map(b => [b.id, b.name]));
        advertiserNames = advertiserIds.map(id => brandsMap.get(id) || '알 수 없는 브랜드');
      }
    } else if (advertiserId) {
      const { data: brandData } = await supabase
        .from('advertisers')
        .select('name')
        .eq('id', advertiserId)
        .single();

      if (brandData) {
        advertiserNames = [brandData.name];
      }
    }

    const { data, error } = await supabase
      .from('invitation_codes')
      .insert({
        code,
        organization_id: organizationId || null,
        advertiser_id: advertiserId || null,
        advertiser_ids: advertiserIds || null,
        advertiser_names: advertiserNames,
        invited_email: email,
        role,
        created_by: req.user.id,
        expires_at: expiresAt.toISOString(),
        invite_type: inviteType || 'existing_member',
        parent_advertiser_id: parentAdvertiserId || null
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ code, ...data });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Failed to create invitation code' });
  }
});

// ============================================
// 초대 코드 검증
// ============================================
router.get('/invitations/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid or expired invitation code' });
    }

    res.json(data);
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({ error: 'Failed to verify invitation code' });
  }
});

// ============================================
// 사용자 목록 조회
// ============================================
router.get('/users', requireAuth, async (req, res) => {
  try {
    if (!canAccessSuperAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        organization_id,
        advertiser_id,
        organization_type,
        status,
        created_at,
        organizations(id, name, type),
        advertisers(id, name)
      `)
      .is('deleted_at', null);

    // agency_admin, agency_manager는 자신의 organization만 조회
    if (req.user.role === 'agency_admin' || req.user.role === 'agency_manager') {
      query = query.eq('organization_id', req.user.organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ============================================
// 권한 변경
// ============================================
router.post('/users/:id/role', requireAuth, async (req, res) => {
  try {
    if (!canAccessSuperAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { role } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
