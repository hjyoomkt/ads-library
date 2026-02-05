import { supabase } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    // 개발 환경에서 인증 우회 (테스트용)
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️  Auth disabled for development');

      // 개발 환경에서도 users 테이블에서 정보 조회
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role, organization_id, advertiser_id, organization_type')
        .eq('email', 'test@zestdot.com')
        .is('deleted_at', null)
        .single();

      req.user = {
        email: 'test@zestdot.com',
        role: userData?.role || 'master',
        organizationId: userData?.organization_id,
        advertiserId: userData?.advertiser_id,
        organizationType: userData?.organization_type
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // users 테이블에서 role, organization_id, advertiser_id 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, role, organization_id, advertiser_id, organization_type')
      .eq('email', user.email)
      .is('deleted_at', null)
      .single();

    if (!userData) {
      return res.status(403).json({ error: 'User not found in system' });
    }

    req.user = {
      ...user,
      role: userData.role,
      organizationId: userData.organization_id,
      advertiserId: userData.advertiser_id,
      organizationType: userData.organization_type
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
