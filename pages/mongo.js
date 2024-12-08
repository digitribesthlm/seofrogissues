import React, { useState, useEffect } from 'react';
import { parseData } from '../utils/mongoParser';
import { calculateSEOScore, groupIssues, getIssueGroup, ISSUE_GROUPS, calculateTotalSEOScore } from '../utils/seoUtils';
import IssueCharts from '../components/IssueCharts';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import { verifyAuth } from '../utils/auth';
import ComparisonMetrics from '../components/ComparisonMetrics';

const IssueRow = ({ issue, onClick, showGroup, comparison }) => {
  const seoScore = calculateSEOScore(issue);
  const issueChange = comparison?.issueChanges.find(
    change => change.issueName === issue['Issue Name']
  );

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
    <tr onClick={onClick} className="hover:bg-gray-50 cursor-pointer">
      {showGroup && (
        <td className="px-6 py-4 text-sm text-gray-500">
          {getIssueGroup(issue['Issue Name'])}
        </td>
      )}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
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
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [activeFilter, setActiveFilter] = useState('All');

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

  useEffect(() => {
    async function loadData() {
      try {
        const result = await parseData();
        if (result.error === 'Not authenticated') {
          router.push('/login');
          return;
        }
        setData(result);

        const comparisonRes = await fetch('/api/mongo-issues/compare');
        const comparisonData = await comparisonRes.json();
        if (comparisonData.success) {
          setComparison(comparisonData.data);
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
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-baseline mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              SEO Dashboard - {domain}
            </h1>
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
                    onClick={() => setSelectedIssue(issue)}
                    showGroup={true}
                    comparison={comparison}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue Details Modal */}
          {selectedIssue && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{selectedIssue['Issue Name']}</h3>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Issue Details</h4>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Type:</span> {selectedIssue['Issue Type']}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> {selectedIssue['Issue Priority']}
                      </div>
                      <div>
                        <span className="font-medium">URLs Affected:</span> {selectedIssue['URLs']}
                      </div>
                      <div>
                        <span className="font-medium">% of Total:</span> {selectedIssue['% of Total']}%
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    <p className="mt-2 text-sm text-gray-500">{selectedIssue['Description']}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">How to Fix</h4>
                    <p className="mt-2 text-sm text-gray-500">{selectedIssue['How To Fix']}</p>
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
  const { req } = context;
  const auth = await verifyAuth(req);

  if (!auth.isAuthenticated) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const { connectToDatabase } = require('../utils/mongodb');
    const { db } = await connectToDatabase();

    // Get all reports and explicitly find the newest
    const allReports = await db.collection('frog_seoReports')
      .find({ clientId: auth.clientId })
      .toArray();

    // Explicitly find the newest report by date comparison
    const newestReport = allReports.reduce((newest, report) => {
      return new Date(report.scan_date) > new Date(newest.scan_date) ? report : newest;
    }, allReports[0]);

    console.log('Header date:', {
      allDates: allReports.map(r => r.scan_date),
      selectedDate: newestReport.scan_date
    });

    return {
      props: {
        domain: newestReport.domain_name,
        scanDate: new Date(newestReport.scan_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
} 