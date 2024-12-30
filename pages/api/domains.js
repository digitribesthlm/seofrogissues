import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();
    
    // Just get unique domain names
    const domains = await db.collection('frog_seoReports')
      .distinct('domain_name', { clientId: auth.clientId });

    // Sort alphabetically and filter out any null/undefined
    const sortedDomains = domains.filter(Boolean).sort();
    
    res.status(200).json({ domains: sortedDomains });
  } catch (error) {
    console.error('Error getting domains:', error);
    res.status(500).json({ error: 'Error getting domains' });
  }
}