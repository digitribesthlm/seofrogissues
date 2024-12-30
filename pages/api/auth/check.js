import { verifyAuth } from '../../../utils/auth';

export default async function handler(req, res) {
  console.log('🔍 Checking authentication status...');
  
  try {
    const auth = await verifyAuth(req);
    console.log('✅ Auth check result:', auth.isAuthenticated);
    
    res.status(200).json({
      isAuthenticated: auth.isAuthenticated,
      user: auth.isAuthenticated ? {
        email: auth.email,
        role: auth.role,
        clientId: auth.clientId
      } : null
    });
  } catch (error) {
    console.error('❌ Auth check error:', error);
    res.status(500).json({ 
      isAuthenticated: false, 
      error: 'Failed to check authentication status' 
    });
  }
}
