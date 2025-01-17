export async function parseData(domain) {
  try {
    const res = await fetch(`/api/mongo-issues${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to load data');
    }

    // Transform the data from the API response
    return {
      issues: data.data.map(issue => ({
        'Issue Name': issue.issueName,
        'Issue Type': issue.issueType,
        'Issue Priority': issue.issuePriority,
        'URLs': issue.urls,
        '% of Total': issue.percentageOfTotal
      })),
      metadata: {
        totalIssues: data.metadata.totalIssues || 0,
        totalAffectedUrls: data.metadata.totalUrls || 0,
        issuesByType: data.metadata.urlsByIssueType || {},
        domain: domain || data.metadata.domain
      }
    };
  } catch (error) {
    console.error('Error parsing data:', error);
    throw error;
  }
}