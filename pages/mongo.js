import React, { useState, useEffect } from 'react';
import { parseData } from '../utils/mongoParser';
import { calculateSEOScore, groupIssues, getIssueGroup, ISSUE_GROUPS, calculateTotalSEOScore } from '../utils/seoUtils';
import IssueCharts from '../components/IssueCharts';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import { verifyAuth } from '../utils/auth';
import ComparisonMetrics from '../components/ComparisonMetrics';
import IssuePopup from '../components/IssuePopup';

const IssueRow = ({ issue, onClick, showGroup, comparison }) => {
  const seoScore = calculateSEOScore(issue);
  const issueChange = comparison?.issueChanges.find(
    change => change.issueName === issue['Issue Name']
  );

  const handleClick = (e) => {
    e.preventDefault();
    console.log('Issue clicked:', issue['Issue Name']);
    onClick(issue);
  };

  // Determine if trend should be reversed based on issue type
  const getTrendDisplay = (issueChange) => {
    if (!issueChange) return null;

    const isOpportunity = issue['Issue Type'] === 'Opportunity';
    const { trend, percentageChange } = issueChange;

    return {
      color: trend === 'improved' ? 'text-green-600' :
             trend === 'worse' ? 'text-red-600' :
             'text-gray-600',
      icon: trend === 'new' ? '🆕' :
            trend === 'unchanged' ? '⚪' :
            trend === 'improved' ? (isOpportunity ? '🔴' : '🟢') :
            isOpportunity ? '🟢' : '🔴',
      percentage: percentageChange
    };
  };

  const trendDisplay = getTrendDisplay(issueChange);

  return (
    <tr onClick={handleClick} className="hover:bg-gray-50 cursor-pointer">
      {showGroup && (
        <td className="px-6 py-4 text-sm text-gray-500">
          {getIssueGroup(issue['Issue Name'])}
        </td>
      )}
      <td className="px-6 py-4">
        <div 
          onClick={handleClick}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
        >
          {issue['Issue Name']}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          issue['Issue Type'] === 'Issue' ? 'bg-red-100 text-red-800' : 
          issue['Issue Type'] === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {issue['Issue Type']}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{issue['Issue Priority']}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{issue['URLs']}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{issue['% of Total']}%</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          seoScore > 75 ? 'bg-red-100 text-red-800' :
          seoScore > 50 ? 'bg-orange-100 text-orange-800' :
          seoScore > 25 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {seoScore}
        </span>
      </td>
      <td className="px-6 py-4">
        {trendDisplay && (
          <div className="flex items-center space-x-2">
            <span>{trendDisplay.icon}</span>
            <span className={`text-sm ${trendDisplay.color}`}>
              {trendDisplay.percentage}%
            </span>
          </div>
        )}
      </td>
    </tr>
  );
};

export default function Dashboard({ domain, scanDate }) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [data, setData] = useState({ issues: [], metadata: {} });
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(domain);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [activeFilter, setActiveFilter] = useState('All');
  const [issueTemplate, setIssueTemplate] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    async function fetchDomains() {
      try {
        const response = await fetch('/api/domains');
        const data = await response.json();
        if (data.domains) {
          setDomains(data.domains);
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    }
    fetchDomains();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await parseData(selectedDomain);
        if (result.error === 'Not authenticated') {
          router.push('/login');
          return;
        }
        setData(result);

        if (selectedDomain) {
          const comparisonRes = await fetch(`/api/mongo-issues/compare?domain=${encodeURIComponent(selectedDomain)}`);
          const comparisonData = await comparisonRes.json();
          if (comparisonData.success) {
            setComparison(comparisonData.data);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        if (error.message.includes('authentication')) {
          router.push('/login');
        }
      }
    }
    loadData();
  }, [router, selectedDomain]);

  const handleDomainChange = (e) => {
    const newDomain = e.target.value;
    setSelectedDomain(newDomain);
    router.push(`/mongo?domain=${encodeURIComponent(newDomain)}`);
  };

  const fetchIssueTemplate = async (issueName) => {
    try {
      console.log('Fetching template for:', issueName);
      setApiError(null);
      const response = await fetch(`/api/issueTemplate?issueName=${encodeURIComponent(issueName)}`);
      console.log('API Response:', response.status);
      const data = await response.json();
      console.log('API Data:', data);
      
      if (!response.ok) {
        console.error('API Error:', data);
        setApiError(data.message || 'Failed to fetch issue template');
        return;
      }
      
      console.log('Template received:', data);
      setIssueTemplate(data);
    } catch (err) {
      console.error('Error fetching issue template:', err);
      setApiError(err.message || 'Failed to fetch issue template');
    }
  };

  const handleIssueClick = async (issue) => {
    console.log('Issue clicked:', issue);
    try {
      const response = await fetch(`/api/mongo-issues?domain=${encodeURIComponent(selectedDomain)}`);
      const data = await response.json();
      
      if (data.success) {
        const enrichedIssue = data.data.find(i => i.issueName === issue['Issue Name']);
        if (enrichedIssue) {
          setIssueTemplate({
            ...issue,
            description: enrichedIssue.description,
            howToFix: enrichedIssue.howToFix
          });
        } else {
          setIssueTemplate(issue);
        }
      } else {
        setIssueTemplate(issue);
      }
    } catch (error) {
      console.error('Error fetching detailed issue info:', error);
      setIssueTemplate(issue);
    }
  };

  // Sorting function
  const sortIssues = (issues, key, direction) => {
    return [...issues].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'URLs' || key === '% of Total') {
        aValue = parseFloat(aValue.replace(/[^0-9.]/g, ''));
        bValue = parseFloat(bValue.replace(/[^0-9.]/g, ''));
      } else if (key === 'SEO Score') {
        aValue = calculateSEOScore(a);
        bValue = calculateSEOScore(b);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    setData(prevData => ({
      ...prevData,
      issues: sortIssues(prevData.issues, key, direction)
    }));
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { key: 'Issue Name', label: 'Issue Name' },
    { key: 'Issue Type', label: 'Type' },
    { key: 'Issue Priority', label: 'Priority' },
    { key: 'URLs', label: 'URLs' },
    { key: '% of Total', label: '% of Total' },
    { key: 'SEO Score', label: 'SEO Score' },
    { key: 'Trend', label: 'Change' }
  ];

  const getCategories = () => {
    const categories = ['All', ...Object.keys(ISSUE_GROUPS)];
    return categories.sort();
  };

  const getFilteredIssues = (issues) => {
    if (activeFilter === 'All') return issues;
    return issues.filter(issue => getIssueGroup(issue['Issue Name']) === activeFilter);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {apiError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{apiError}</span>
            <button 
              onClick={() => setApiError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}
        {issueTemplate && (
          <IssuePopup
            issue={issueTemplate}
            onClose={() => {
              setIssueTemplate(null);
              setApiError(null);
            }}
          />
        )}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                SEO Dashboard
              </h1>
              <div className="w-full max-w-xs">
                <label htmlFor="domain-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Domain
                </label>
                <select
                  id="domain-select"
                  value={selectedDomain}
                  onChange={handleDomainChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a domain...</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-gray-500 mt-2 sm:mt-0">
              Last scan: {scanDate}
            </p>
          </div>
          
          {/* Comparison Metrics */}
          {comparison && <ComparisonMetrics comparison={comparison} />}

          {/* SEO Score Card */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-gray-500 text-sm font-medium">Overall SEO Score</h3>
            <div className="mt-2 flex items-baseline">
              <p className={`text-3xl font-bold ${getScoreColor(calculateTotalSEOScore(data.issues))}`}>
                {calculateTotalSEOScore(data.issues)}
              </p>
              <p className="ml-1 text-sm text-gray-500">/100</p>
              {comparison?.metrics?.seoScore && (
                <span className={`ml-2 text-sm ${comparison.metrics.seoScore.trend === 'improved' ? 'text-green-600' : 'text-red-600'}`}>
                  {comparison.metrics.seoScore.trend === 'improved' ? '↑' : '↓'} 
                  {Math.abs(comparison.metrics.seoScore.percentageChange)}%
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(calculateTotalSEOScore(data.issues)).replace('text-', 'bg-')}`}
                  style={{ width: `${calculateTotalSEOScore(data.issues)}%` }}
                />
              </div>
            </div>
          </div>

          <IssueCharts data={data} />

          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${activeFilter === category
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                >
                  {category}
                  {category !== 'All' && (
                    <span className="ml-2 text-xs">
                      ({data.issues.filter(issue => getIssueGroup(issue['Issue Name']) === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Issues Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        <span className="text-gray-400">{getSortIndicator(column.key)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredIssues(data.issues).map((issue, index) => (
                  <IssueRow 
                    key={index} 
                    issue={issue} 
                    onClick={handleIssueClick}
                    showGroup={true}
                    comparison={comparison}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue Details Modal */}
          {selectedIssue && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{selectedIssue.name}</h3>
                  <button 
                    onClick={() => setSelectedIssue(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className="text-sm">{selectedIssue.issueType}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <span className="text-sm">{selectedIssue.issuePriority}</span>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-sm text-gray-700">{selectedIssue.description}</p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">How to Fix</h4>
                    <p className="text-sm text-gray-700">{selectedIssue.howToFix}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  try {
    const auth = await verifyAuth(context.req);
    if (!auth?.isAuthenticated || !auth?.clientId) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const { connectToDatabase } = require('../utils/mongodb');
    const { db } = await connectToDatabase();

    const report = await db.collection('frog_seoReports')
      .findOne(
        { clientId: auth.clientId },
        { 
          sort: { scan_date: -1 },
          projection: { 
            domain_name: 1, 
            scan_date: 1,
            all_issues: 1,
            _id: 0 
          }
        }
      );

    if (!report) {
      return {
        props: {
          domain: 'No Data',
          scanDate: 'Never'
        }
      };
    }

    const formattedDate = new Date(report.scan_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      props: {
        domain: report.domain_name || 'unknown',
        scanDate: formattedDate
      }
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      props: {
        domain: 'Error',
        scanDate: 'Error loading data'
      }
    };
  }
} 