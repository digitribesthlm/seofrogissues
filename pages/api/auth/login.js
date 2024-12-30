// pages/api/auth/login.js
import { connectToDatabase } from '../../../utils/mongodb';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  console.log('🔐 Authentication request received');
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    console.log('📧 Attempting login for email:', email);

    console.log('🔌 Connecting to database...');
    const { db } = await connectToDatabase();
    console.log('✅ Database connection established');

    console.log('🔍 Searching for user in database...');
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('✅ User found');

    // Simple string comparison for password
    console.log('🔐 Verifying password...');
    if (password !== user.password) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('✅ Password verified');

    // Create token using user's actual clientId
    console.log('🎟️ Creating authentication token...');
    const token = Buffer.from(
      JSON.stringify({
        userId: user._id.toString(),
        email: user.email,
        clientId: user.clientId,
        role: user.role || 'user',
      })
    ).toString('base64');

    // Set cookie
    console.log('🍪 Setting authentication cookie...');
    res.setHeader(
      'Set-Cookie',
      serialize('auth-token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      })
    );

    console.log('✅ Authentication successful for user:', email);
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: {
        email: user.email,
        role: user.role || 'user',
        clientId: user.clientId
      }
    });

  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
