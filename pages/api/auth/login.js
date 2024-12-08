// pages/api/auth/login.js
import { connectToDatabase } from '../../../utils/mongodb';
import { serialize } from 'cookie';
import { useRouter } from 'next/router';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    const { db } = await connectToDatabase();

    // Find user in users collection
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Simple string comparison for password
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token using user's actual clientId
    const token = Buffer.from(
      JSON.stringify({
        userId: user._id.toString(),
        email: user.email,
        role: user.role || 'user',
        clientId: user.clientId
      })
    ).toString('base64');

    res.setHeader(
      'Set-Cookie',
      serialize('auth-token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    );

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        email: user.email,
        role: user.role || 'user',
      },
    });

    const router = useRouter();
    if (res.ok) {
      router.push('/');
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
