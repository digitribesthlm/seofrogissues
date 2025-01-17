import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export default async function handler(req, res) {
  try {
    // Verify authentication using existing auth flow
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();

    // Get the latest SEO report for this specific client
    const seoReport = await db.collection('frog_seoReports')
      .findOne(
        { clientId: auth.clientId },
        { sort: { scan_date: -1 } }
      );

    if (!seoReport) {
      throw new Error('No SEO report found for this client');
    }

    // Get issue templates
    const issueTemplates = await db.collection('frog_issueTemplates')
      .find({}).toArray();

    // Create template map
    const templateMap = issueTemplates.reduce((acc, template) => {
      acc[template.issueName] = template;
      return acc;
    }, {});

    // Combine issues with templates
    const enrichedIssues = seoReport.all_issues.map(issue => ({
      ...issue,
      Description: templateMap[issue.issueName]?.description || '',
      'How To Fix': templateMap[issue.issueName]?.howToFix || ''
    }));

    return res.status(200).json({ 
      data: enrichedIssues,
      success: true,
      metadata: seoReport.metadata,
      domain: seoReport.domain_name
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to load issues data',
      errorDetails: error.message,
      success: false,
      data: [] 
    });
  }
} 