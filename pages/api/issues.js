import { readFile } from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'issues_overview_report.csv');
    const fileContent = await readFile(filePath, 'utf-8');
    
    // Remove any BOM characters and normalize line endings
    const cleanContent = fileContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      relax_quotes: true,
      relax_column_count: true,
      columns: [
        'Issue Name',
        'Issue Type',
        'Issue Priority',
        'URLs',
        '% of Total',
        'Description',
        'How To Fix'
      ]
    });

    // Return data in a structured format
    res.status(200).json({ 
      data: records,
      success: true 
    });
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      fileExists: await fileExists(path.join(process.cwd(), 'data', 'issues_overview_report.csv'))
    });
    
    res.status(500).json({ 
      error: 'Failed to load issues data',
      errorDetails: error.message,
      success: false,
      data: [] 
    });
  }
}

async function fileExists(filepath) {
  try {
    await readFile(filepath);
    return true;
  } catch {
    return false;
  }
} 