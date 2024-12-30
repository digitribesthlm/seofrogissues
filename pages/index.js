import React, { useState, useEffect } from 'react';
import { parseData } from '../utils/dataParser';
import { calculateSEOScore, groupIssues, getIssueGroup, ISSUE_GROUPS, calculateTotalSEOScore } from '../utils/seoUtils';
import IssueCharts from '../components/IssueCharts';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';

const IssueRow = ({ issue, onClick, showGroup }) => {
  const seoScore = calculateSEOScore(issue);
  
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
    </tr>
  );
};

export async function getServerSideProps(context) {
  const { verifyAuth } = require('../utils/auth');
  
  try {
    const auth = await verifyAuth(context.req);
    
    if (!auth.isAuthenticated) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    return {
      props: {
        domain: process.env.DOMAIN || 'example.com',
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}

export default function Dashboard({ domain }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const { issues, metadata } = await parseData();
        setData(issues);
        setMetadata(metadata);
        setGroupedData(groupIssues(issues));
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Please log in')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{error}</div>
      </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SEO Issues Dashboard - {domain}
          </h1>
          
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total SEO Score Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Overall SEO Score</h3>
              <div className="mt-2 flex items-baseline">
                <p className={`text-3xl font-bold ${getScoreColor(calculateTotalSEOScore(data))}`}>
                  {calculateTotalSEOScore(data)}
                </p>
                <p className="ml-1 text-sm text-gray-500">/100</p>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getScoreColor(calculateTotalSEOScore(data)).replace('text-', 'bg-')}`}
                    style={{ width: `${calculateTotalSEOScore(data)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Total Issues Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Issues</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metadata.totalIssues}</p>
            </div>
            
            {/* Total URLs Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Affected URLs</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metadata.totalAffectedUrls}</p>
            </div>
            
            {/* Issues by Priority */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Issues by Type</h3>
              <div className="mt-2 space-y-2">
                {metadata?.issuesByType && Object.entries(metadata.issuesByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{type}</span>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <IssueCharts data={{ issues: data, metadata: metadata }} />

          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(ISSUE_GROUPS).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedIssue(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${category === 'All'
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                >
                  {category}
                  {category !== 'All' && (
                    <span className="ml-2 text-xs">
                      ({data.filter(issue => getIssueGroup(issue['Issue Name']) === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Modified Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URLs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SEO Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((issue, index) => (
                  <IssueRow 
                    key={index} 
                    issue={issue} 
                    onClick={() => setSelectedIssue(issue)}
                    showGroup={true}
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
