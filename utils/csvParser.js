export async function parseCSVData() {
  try {
    const response = await fetch('/api/issues');
    const { data } = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received');
    }

    // Calculate metadata from CSV data
    const metadata = {
      totalIssues: data.length,
      issuesByType: data.reduce((acc, issue) => {
        acc[issue['Issue Type']] = (acc[issue['Issue Type']] || 0) + 1;
        return acc;
      }, {}),
      totalAffectedUrls: data.reduce((acc, issue) => {
        // Convert string to number and handle any non-numeric values
        const urls = parseInt(issue['URLs'].replace(/[^0-9]/g, '')) || 0;
        return acc + urls;
      }, 0)
    };

    return { issues: data, metadata };
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return { 
      issues: [], 
      metadata: { 
        totalIssues: 0, 
        issuesByType: {}, 
        totalAffectedUrls: 0 
      } 
    };
  }
} 