import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

const cleanValue = (value) => {
  if (typeof value !== 'string') return value;
  // Remove quotes and trim whitespace
  return value.replace(/^["'](.+)["']$/, '$1').trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();
    const { records, domain } = req.body;
    const parsedRecords = Array.isArray(records) ? records : JSON.parse(records);

    // First, get all issue templates
    const issueTemplates = await db.collection('frog_issueTemplates')
      .find({})
      .toArray();

    // Create a map for quick lookup
    const templateMap = new Map(
      issueTemplates.map(template => [template.issueName, template])
    );

    // Process records and enrich with template data
    const enrichedRecords = parsedRecords.map(record => {
      const template = templateMap.get(record['Issue Name']);
      return {
        issueName: record['Issue Name'],
        issueType: record['Issue Type'],
        issuePriority: record['Issue Priority'],
        urls: record['URLs'],
        percentageOfTotal: record['% of Total'],
        // Add description and howToFix if available in template
        ...(template && {
          description: template.description,
          howToFix: template.howToFix
        })
      };
    });

    // Create SEO report document
    const seoReport = {
      clientId: auth.clientId,
      domain_name: domain,
      scan_date: new Date(),
      all_issues: enrichedRecords,
      metadata: {
        totalIssues: enrichedRecords.length,
        generatedAt: new Date().toISOString().split('T')[0],
        totalUrls: enrichedRecords.reduce((sum, record) => {
          const urls = record.urls || '0';
          return sum + parseInt(urls.replace(/[^0-9]/g, '') || 0);
        }, 0),
        urlsByIssueType: enrichedRecords.reduce((acc, record) => {
          const type = record.issueType;
          const urls = record.urls || '0';
          acc[type] = (acc[type] || 0) + parseInt(urls.replace(/[^0-9]/g, '') || 0);
          return acc;
        }, {})
      }
    };

    // Save to MongoDB
    await db.collection('frog_seoReports').insertOne(seoReport);

    // Update issue templates with any new issues
    for (const record of enrichedRecords) {
      if (!templateMap.has(record.issueName)) {
        await db.collection('frog_issueTemplates').insertOne({
          issueName: record.issueName,
          issueType: record.issueType,
          issuePriority: record.issuePriority,
          description: record.description || '',
          howToFix: record.howToFix || ''
        });
      }
    }

    return res.status(200).json({ 
      success: true,
      message: `Successfully uploaded SEO report for ${domain} with ${enrichedRecords.length} issues`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message
    });
  }
}