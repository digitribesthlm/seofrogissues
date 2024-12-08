const fs = require('fs');
const csv = require('csv-parse');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

async function importCsvToMongo(filePath, clientId) {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);

    // Read and parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = await new Promise((resolve, reject) => {
      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    // Create SEO report document
    const seoReport = {
      clientId,
      domain_name: filePath.split('_').pop().replace('.csv', ''),
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
        totalUrls: records.reduce((sum, record) => sum + parseInt(record['URLs'] || 0), 0),
        urlsByIssueType: records.reduce((acc, record) => {
          const type = record['Issue Type'];
          acc[type] = (acc[type] || 0) + parseInt(record['URLs'] || 0);
          return acc;
        }, {})
      }
    };

    // Insert into MongoDB
    await db.collection('frog_seoReports').insertOne(seoReport);
    console.log(`Imported ${filePath} successfully`);

    await client.close();
  } catch (error) {
    console.error(`Error importing ${filePath}:`, error);
  }
}

// Import all CSV files
const csvFiles = [
  { path: './data/issues_overview_report_c_se.csv', clientId: '6750d1d3aaba4edf40a3b8f1' },
  { path: './data/issues_overview_report_react.csv', clientId: '6750d1d3aaba4edf40a3b8f1' },
  { path: './data/issues_overview_report_uk.csv', clientId: '6750d1d3aaba4edf40a3b8f1' },
  { path: './data/issues_overview_report.csv', clientId: '6750d1d3aaba4edf40a3b8f1' }
];

async function importAll() {
  for (const file of csvFiles) {
    await importCsvToMongo(file.path, file.clientId);
  }
}

importAll().then(() => console.log('Import complete')); 