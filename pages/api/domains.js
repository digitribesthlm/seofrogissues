import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const files = await fs.readdir(dataDir);
    
    // Read all JSON files and extract unique domains
    const domains = new Set();
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(dataDir, file), 'utf8');
        const data = JSON.parse(content);
        if (data.domain) {
          domains.add(data.domain);
        }
      }
    }

    res.status(200).json({ domains: Array.from(domains) });
  } catch (error) {
    console.error('Error getting domains:', error);
    res.status(500).json({ error: 'Error getting domains' });
  }
} 