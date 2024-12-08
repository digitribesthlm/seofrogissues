export async function parseData() {
  try {
    const response = await fetch('/api/mongo-issues');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, metadata } = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received');
    }

    return { issues: data, metadata };
  } catch (error) {
    console.error('Error fetching data:', error);
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