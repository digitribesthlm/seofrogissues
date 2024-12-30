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
    const { domain } = req.body;
    const records = Array.isArray(req.body.records) ? req.body.records : JSON.parse(req.body.records);

    // Clean the records
    const cleanedRecords = records.map(record => ({
      issueName: cleanValue(record['Issue Name']),
      issueType: cleanValue(record['Issue Type']),
      issuePriority: cleanValue(record['Issue Priority']),
      urls: cleanValue(record['URLs']),
      percentageOfTotal: cleanValue(record['% of Total']?.replace('%', '')),
      description: cleanValue(record['Description'] || ''),
      howToFix: cleanValue(record['How To Fix'] || '')
    }));

    // Create SEO report document
    const seoReport = {
      clientId: auth.clientId,
      domain_name: domain || 'unknown',
      scan_date: new Date(),
      all_issues: cleanedRecords,
      metadata: {
        totalIssues: cleanedRecords.length,
        generatedAt: new Date().toISOString().split('T')[0],
        totalUrls: cleanedRecords.reduce((sum, record) => {
          const urls = record.urls || '0';
          return sum + parseInt(urls.replace(/[^0-9]/g, '') || 0);
        }, 0),
        urlsByIssueType: cleanedRecords.reduce((acc, record) => {
          const type = record.issueType;
          const urls = record.urls || '0';
          acc[type] = (acc[type] || 0) + parseInt(urls.replace(/[^0-9]/g, '') || 0);
          return acc;
        }, {})
      }
    };

    // Save to MongoDB
    await db.collection('frog_seoReports').insertOne(seoReport);

    return res.status(200).json({ 
      success: true,
      message: `Successfully uploaded SEO report with ${cleanedRecords.length} issues`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to process upload',
      details: error.message
    });
  }
}