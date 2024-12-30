import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

const cleanValue = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/^["'](.+)["']$/, '$1').trim();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Get all reports for the domain, sorted by date
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

    // Clean the data before sending
    const cleanedIssues = latestReport.all_issues.map(issue => ({
      issueName: cleanValue(issue.issueName),
      issueType: cleanValue(issue.issueType),
      issuePriority: cleanValue(issue.issuePriority),
      urls: cleanValue(issue.urls),
      percentageOfTotal: cleanValue(issue.percentageOfTotal),
      description: cleanValue(issue.description || ''),
      howToFix: cleanValue(issue.howToFix || '')
    }));

    return res.status(200).json({ 
      success: true,
      data: cleanedIssues,
      metadata: {
        ...latestReport.metadata,
        issuesByType: Object.entries(latestReport.metadata.urlsByIssueType || {}).reduce((acc, [key, value]) => {
          acc[cleanValue(key)] = value;
          return acc;
        }, {})
      },
      domain: latestReport.domain_name
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to load issues data',
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