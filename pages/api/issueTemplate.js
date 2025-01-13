import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { issueName } = req.query;
  if (!issueName) {
    console.error('Missing issueName parameter');
    return res.status(400).json({ message: 'Issue name is required' });
  }

  try {
    console.log('Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('Connected to MongoDB');
    
    // First, let's see what's in the collection
    const allTemplates = await db.collection('frog_issueTemplates').find({}).toArray();
    console.log('All templates in collection:', allTemplates.map(t => t.issueName));

    console.log('Searching for issue template:', issueName);
    // Try both field names
    const issueTemplate = await db.collection('frog_issueTemplates').findOne({
      issueName: issueName
    });

    if (!issueTemplate) {
      console.error('Issue template not found:', issueName);
      return res.status(404).json({ 
        message: `Issue template not found for: ${issueName}`,
        searchedFor: issueName,
        availableTemplates: allTemplates.map(t => t.issueName)
      });
    }

    console.log('Found issue template:', issueTemplate);
    res.status(200).json(issueTemplate);
  } catch (error) {
    console.error('MongoDB Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
