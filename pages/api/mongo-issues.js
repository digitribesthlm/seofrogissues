import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export default async function handler(req, res) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();

    const seoReport = await db.collection('frog_seoReports')
      .findOne(
        { clientId: auth.clientId },
        { sort: { scan_date: -1 } }
      );

    if (!seoReport) {
      throw new Error('No SEO report found for this client');
    }

    const issueTemplates = await db.collection('frog_issueTemplates')
      .find({}).toArray();

    const templateMap = issueTemplates.reduce((acc, template) => {
      acc[template.issueName] = template;
      return acc;
    }, {});

    const enrichedIssues = seoReport.all_issues.map(issue => ({
      'Issue Name': issue.issueName,
      'Issue Type': issue.issueType,
      'Issue Priority': issue.issuePriority,
      'URLs': issue.urls,
      '% of Total': issue.percentageOfTotal,
      'Description': templateMap[issue.issueName]?.description || '',
      'How To Fix': templateMap[issue.issueName]?.howToFix || ''
    }));

    const metadata = {
      totalIssues: seoReport.metadata.totalIssues,
      issuesByType: seoReport.metadata.urlsByIssueType,
      totalAffectedUrls: seoReport.metadata.totalUrls
    };

    return res.status(200).json({ 
      data: enrichedIssues,
      success: true,
      metadata,
      domain: seoReport.domain_name
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