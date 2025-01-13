import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const issueName = req.query.name;

    // Find the issue template
    const template = await db.collection('frog_issueTemplates')
      .findOne({ 
        issueName: { $regex: new RegExp(`^${issueName}$`, 'i') } // Case-insensitive exact match
      });

    if (!template) {
      return res.status(404).json({ 
        success: false,
        error: 'Issue template not found' 
      });
    }

    // Return the template data
    return res.status(200).json({
      success: true,
      data: {
        description: template.description,
        howToFix: template.howToFix,
        issueName: template.issueName,
        issueType: template.issueType,
        issuePriority: template.issuePriority
      }
    });
  } catch (error) {
    console.error('Error fetching issue template:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch issue template' 
    });
  }
} 