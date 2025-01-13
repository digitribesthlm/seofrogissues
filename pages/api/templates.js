import { connectToDatabase } from '../../utils/mongodb';
import { verifyAuth } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();
    
    // Log the collection name we're querying
    console.log('Querying collection: frog_issueTemplates');

    // Fetch all templates and log the count
    const templates = await db.collection('frog_issueTemplates')
      .find({})
      .toArray();

    console.log('Found templates:', templates.length);
    console.log('Sample template:', templates[0]); // Log first template for debugging

    if (templates.length === 0) {
      console.log('No templates found in database');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      data: templates.map(template => ({
        _id: template._id,
        issueName: template.issueName,
        issueType: template.issueType,
        issuePriority: template.issuePriority,
        description: template.description || 'No description available',
        howToFix: template.howToFix || 'No fix instructions available'
      }))
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ 
      success: false,
      error: `Failed to fetch templates: ${error.message}` 
    });
  }
} 