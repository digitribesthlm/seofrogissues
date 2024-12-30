import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export default async function handler(req, res) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { domain } = req.query;
    const { db } = await connectToDatabase();

    // Build query
    const query = { clientId: auth.clientId };
    if (domain) {
      query.domain_name = domain;
    }

    // Get all reports and sort by date
    const allReports = await db.collection('frog_seoReports')
      .find(query)
      .sort({ scan_date: -1 })
      .toArray();

    if (allReports.length === 0) {
      return res.status(404).json({ 
        error: 'No reports found',
        success: false,
        data: [],
        metadata: {
          totalIssues: 0,
          issuesByType: {},
          totalAffectedUrls: 0
        }
      });
    }

    const latestReport = allReports[0];

    console.log('Using report from:', new Date(latestReport.scan_date).toISOString());

    return res.status(200).json({ 
      data: latestReport.all_issues,
      success: true,
      metadata: latestReport.metadata,
      domain: latestReport.domain_name
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to load issues data',
      errorDetails: error.message,
      success: false,
      data: [],
      metadata: {
        totalIssues: 0,
        issuesByType: {},
        totalAffectedUrls: 0
      }
    });
  }
}