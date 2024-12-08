// Priority score weights
const PRIORITY_WEIGHTS = {
  'High': 100,
  'Medium': 50,
  'Low': 25
};

// Issue type weights
const TYPE_WEIGHTS = {
  'Issue': 2,
  'Warning': 1,
  'Opportunity': 0.5
};

// Issue groups mapping with expanded categories
export const ISSUE_GROUPS = {
  'Meta Description': [
    'Meta Description',
    'Meta Description Length',
    'Missing Meta Description',
    'Duplicate Meta Description'
  ],
  'Canonicals': [
    'Canonicals',
    'Canonicalised',
    'Non-Indexable Canonical',
    'Missing Canonical'
  ],
  'Response Codes': [
    'Internal Server Error',
    'Client Error',
    '404',
    '500',
    '301',
    '302',
    'Status Code'
  ],
  'Headers': [
    'H1',
    'H2',
    'Missing H1',
    'Multiple H1',
    'Long H1',
    'Header'
  ],
  'Security': [
    'HTTPS',
    'SSL',
    'Mixed Content',
    'Security Headers',
    'HTTP'
  ],
  'Links': [
    'Broken Links',
    'Internal Links',
    'External Links',
    'Nofollow Links',
    'Link'
  ],
  'Images': [
    'Image',
    'Alt Text',
    'Missing Alt',
    'Large Images',
    'Broken Images'
  ],
  'Page Content': [
    'Page Titles',
    'Title',
    'Content Length',
    'Duplicate Content',
    'Word Count'
  ],
  'URLs': [
    'URL',
    'URL Length',
    'URL Structure',
    'URL Path',
    'Repetitive Path'
  ],
  'Performance': [
    'Load Time',
    'Page Size',
    'Compression',
    'Cache',
    'Speed'
  ],
  'Mobile': [
    'Mobile Friendly',
    'Viewport',
    'Mobile Layout',
    'Touch Elements'
  ],
  'Indexation': [
    'Index',
    'Noindex',
    'Robots',
    'Sitemap'
  ]
};

export function calculateSEOScore(issue) {
  const priorityScore = PRIORITY_WEIGHTS[issue['Issue Priority']] || 0;
  const typeScore = TYPE_WEIGHTS[issue['Issue Type']] || 0;
  
  // Handle both string and number types for URLs
  const urlsAffected = typeof issue['URLs'] === 'string'
    ? parseInt(issue['URLs'].replace(/[^0-9]/g, ''))
    : parseInt(issue['URLs']) || 0;
  
  // Calculate weighted score
  const score = (priorityScore * typeScore * Math.log10(urlsAffected + 1)) / 100;
  
  return Math.round(score * 100) / 100;
}

export function getIssueGroup(issueName) {
  if (!issueName) return 'Other';
  
  const lowerName = issueName.toLowerCase();
  
  for (const [group, patterns] of Object.entries(ISSUE_GROUPS)) {
    if (patterns.some(pattern => 
      lowerName.includes(pattern.toLowerCase()) || 
      pattern.toLowerCase().includes(lowerName)
    )) {
      return group;
    }
  }
  return 'Other';
}

export function groupIssues(issues) {
  const grouped = issues.reduce((groups, issue) => {
    const group = getIssueGroup(issue['Issue Name']);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(issue);
    return groups;
  }, {});

  // Sort groups by total SEO score
  const sortedGroups = {};
  Object.keys(grouped)
    .sort((a, b) => {
      const aScore = grouped[a].reduce((sum, issue) => sum + calculateSEOScore(issue), 0);
      const bScore = grouped[b].reduce((sum, issue) => sum + calculateSEOScore(issue), 0);
      return bScore - aScore;
    })
    .forEach(key => {
      sortedGroups[key] = grouped[key].sort((a, b) => 
        calculateSEOScore(b) - calculateSEOScore(a)
      );
    });

  return sortedGroups;
}

// Add this function to calculate total SEO score
export function calculateTotalSEOScore(issues) {
  const WEIGHT_FACTORS = {
    Priority: {
      'High': -3,
      'Medium': -2,
      'Low': -1
    },
    Type: {
      'Issue': 1.5,
      'Warning': 1,
      'Opportunity': 0.5
    }
  };

  let totalDeductions = 0;
  let maxPossibleDeductions = issues.length * 3 * 1.5; // worst case: all high priority issues

  issues.forEach(issue => {
    const priorityWeight = WEIGHT_FACTORS.Priority[issue['Issue Priority']] || -1;
    const typeWeight = WEIGHT_FACTORS.Type[issue['Issue Type']] || 1;
    
    // Handle both string and number types for URLs
    const urlCount = typeof issue['URLs'] === 'string' 
      ? parseInt(issue['URLs'].replace(/[^0-9]/g, '')) 
      : parseInt(issue['URLs']) || 0;
      
    const urlFactor = Math.log10(urlCount + 1) / 2; // Logarithmic scaling for URL count

    totalDeductions += Math.abs(priorityWeight * typeWeight * urlFactor);
  });

  // Calculate score (100 - percentage of max deductions)
  const score = Math.max(0, Math.round(100 - (totalDeductions / maxPossibleDeductions * 100)));
  
  return score;
} 