import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { domain } = req.query;

    // First, let's log what we're looking for
    console.log('Looking for domain:', domain);

    const report = await db.collection('frog_seoReports')
      .findOne(
        { domain_name: domain },
        { sort: { scan_date: -1 } }
      );

    if (!report) {
      return res.status(200).json({ 
        success: true,
        data: [],
        metadata: {
          totalIssues: 0,
          totalUrls: 0,
          urlsByIssueType: {},
          domain: domain
        }
      });
    }

    // Get all issue templates and log them
    const templates = await db.collection('frog_issueTemplates')
      .find({})
      .toArray();
    
    console.log('Found templates:', templates.map(t => t.issueName));

    // Create a map of templates for quick lookup, removing quotes from keys
    const templateMap = new Map(
      templates.map(template => [
        template.issueName.replace(/^"|"$/g, ''), // Remove surrounding quotes
        template
      ])
    );

    // Enrich the issues with template data and log matches
    const enrichedIssues = report.all_issues.map(issue => {
      const template = templateMap.get(issue.issueName);
      console.log('Matching:', issue.issueName, 'with template:', template?.issueName);
      
      return {
        issueName: issue.issueName,
        issueType: issue.issueType,
        issuePriority: issue.issuePriority,
        urls: issue.urls,
        percentageOfTotal: issue.percentageOfTotal,
        description: template?.description?.replace(/^"|"$/g, '') || 'No description available',
        howToFix: template?.howToFix?.replace(/^"|"$/g, '') || 'No fix instructions available'
      };
    });

    // Return the enriched data with metadata
    return res.status(200).json({
      success: true,
      data: enrichedIssues,
      metadata: {
        totalIssues: report.metadata.totalIssues,
        totalUrls: report.metadata.totalUrls,
        urlsByIssueType: report.metadata.urlsByIssueType,
        domain: report.domain_name
      }
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return res.status(200).json({ 
      success: false,
      error: 'Failed to fetch issues'
    });
  }
}