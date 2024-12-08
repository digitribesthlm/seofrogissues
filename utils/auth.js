export async function verifyAuth(req) {
    const authToken = req.cookies['auth-token'];
  
    if (!authToken) {
      return { isAuthenticated: false };
    }
  
    try {
      const decoded = JSON.parse(Buffer.from(authToken, 'base64').toString());
  
      return {
        isAuthenticated: true,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        clientId: decoded.clientId,
      };
    } catch (error) {
      console.error('Auth verification error:', error);
      return { isAuthenticated: false };
    }
  }
  