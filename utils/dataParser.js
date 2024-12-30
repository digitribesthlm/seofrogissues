export async function parseData() {
  try {
    const response = await fetch('/api/issues');
    
    // Check if response is ok
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to access this data');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Log response type and status
    console.log('Response type:', response.headers.get('content-type'));
    console.log('Response status:', response.status);

    const text = await response.text(); // Get response as text first
    
    try {
      const { data, metadata } = JSON.parse(text); // Try to parse as JSON
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      // Use the metadata from MongoDB if available, otherwise calculate it
      const calculatedMetadata = metadata || {
        totalIssues: data.length,
        issuesByType: data.reduce((acc, issue) => {
          acc[issue['Issue Type']] = (acc[issue['Issue Type']] || 0) + 1;
          return acc;
        }, {}),
        totalAffectedUrls: data.reduce((acc, issue) => {
          const urls = typeof issue['URLs'] === 'string'
            ? parseInt(issue['URLs'].replace(/[^0-9]/g, ''))
            : parseInt(issue['URLs']) || 0;
          return acc + urls;
        }, 0)
      };

      return { issues: data, metadata: calculatedMetadata };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', text.substring(0, 200)); // Log first 200 chars
      throw parseError;
    }
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