import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
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
    const { domain } = req.body;  // Extract domain from form data
    const records = Array.isArray(req.body.records) ? req.body.records : JSON.parse(req.body.records);

    // Create SEO report document
    const seoReport = {
      clientId: auth.clientId,
      domain_name: domain || 'unknown',  // Use the domain from form data
      scan_date: new Date(),
      all_issues: records.map(record => ({
        issueName: record['Issue Name'],
        issueType: record['Issue Type'],
        issuePriority: record['Issue Priority'],
        urls: record['URLs'],
        percentageOfTotal: record['% of Total']
      })),
      metadata: {
        totalIssues: records.length,
        generatedAt: new Date().toISOString().split('T')[0],
        totalUrls: records.reduce((sum, record) => {
          const urls = record['URLs'] || '0';
          return sum + parseInt(urls.replace(/[^0-9]/g, '') || 0);
        }, 0),
        urlsByIssueType: records.reduce((acc, record) => {
          const type = record['Issue Type'];
          const urls = record['URLs'] || '0';
          acc[type] = (acc[type] || 0) + parseInt(urls.replace(/[^0-9]/g, '') || 0);
          return acc;
        }, {})
      }
    };

    // Save to MongoDB
    await db.collection('frog_seoReports').insertOne(seoReport);

    return res.status(200).json({ 
      success: true,
      message: `Successfully uploaded SEO report with ${records.length} issues`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message
    });
  }
} 