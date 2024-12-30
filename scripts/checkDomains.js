const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDomains() {
  const uri = process.env.MONGODB_URI;
  const client = await MongoClient.connect(uri);
  const db = client.db(process.env.MONGODB_DB);

  try {
    const domains = await db.collection('frog_seoReports').distinct('domain_name');
    console.log('All domains in frog_seoReports:', domains);

    // Get a sample document to see its structure
    const sampleDoc = await db.collection('frog_seoReports').findOne({});
    console.log('\nSample document structure:', JSON.stringify(sampleDoc, null, 2));

    // Count documents by domain
    const counts = await db.collection('frog_seoReports').aggregate([
      {
        $group: {
          _id: '$domain_name',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('\nDocument counts by domain:', counts);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDomains();
