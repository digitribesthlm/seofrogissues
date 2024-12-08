import { connectToDatabase } from '../../../utils/mongodb';
import { verifyAuth } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();

    // Get the two most recent reports for comparison
    const reports = await db.collection('frog_seoReports')
      .find({ clientId: auth.clientId })
      .sort({ scan_date: -1 })
      .limit(2)
      .toArray();

    if (reports.length < 2) {
      return res.status(404).json({ 
        error: 'Not enough reports for comparison',
        reportsFound: reports.length
      });
    }

    const [newerReport, olderReport] = reports;

    // Add date information to the comparison
    const comparison = {
      dates: {
        current: newerReport.scan_date,
        previous: olderReport.scan_date,
        daysBetween: Math.floor((new Date(newerReport.scan_date) - new Date(olderReport.scan_date)) / (1000 * 60 * 60 * 24)),
        formattedCurrent: new Date(newerReport.scan_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        formattedPrevious: new Date(olderReport.scan_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      metrics: {
        totalIssues: {
          current: newerReport.metadata.totalIssues,
          previous: olderReport.metadata.totalIssues,
          change: newerReport.metadata.totalIssues - olderReport.metadata.totalIssues,
          percentageChange: ((newerReport.metadata.totalIssues - olderReport.metadata.totalIssues) / olderReport.metadata.totalIssues * 100).toFixed(1),
          trend: newerReport.metadata.totalIssues < olderReport.metadata.totalIssues ? 'improved' : 'worse'
        },
        totalUrls: {
          current: newerReport.metadata.totalUrls,
          previous: olderReport.metadata.totalUrls,
          change: newerReport.metadata.totalUrls - olderReport.metadata.totalUrls,
          percentageChange: ((newerReport.metadata.totalUrls - olderReport.metadata.totalUrls) / olderReport.metadata.totalUrls * 100).toFixed(1),
          trend: newerReport.metadata.totalUrls < olderReport.metadata.totalUrls ? 'improved' : 'worse'
        },
        byType: {
          Issue: {
            current: newerReport.metadata.urlsByIssueType.Issue || 0,
            previous: olderReport.metadata.urlsByIssueType.Issue || 0,
            change: (newerReport.metadata.urlsByIssueType.Issue || 0) - (olderReport.metadata.urlsByIssueType.Issue || 0),
            percentageChange: (((newerReport.metadata.urlsByIssueType.Issue || 0) - (olderReport.metadata.urlsByIssueType.Issue || 0)) / (olderReport.metadata.urlsByIssueType.Issue || 1) * 100).toFixed(1),
            trend: (newerReport.metadata.urlsByIssueType.Issue || 0) < (olderReport.metadata.urlsByIssueType.Issue || 0) ? 'improved' : 'worse'
          },
          Warning: {
            current: newerReport.metadata.urlsByIssueType.Warning || 0,
            previous: olderReport.metadata.urlsByIssueType.Warning || 0,
            change: (newerReport.metadata.urlsByIssueType.Warning || 0) - (olderReport.metadata.urlsByIssueType.Warning || 0),
            percentageChange: (((newerReport.metadata.urlsByIssueType.Warning || 0) - (olderReport.metadata.urlsByIssueType.Warning || 0)) / (olderReport.metadata.urlsByIssueType.Warning || 1) * 100).toFixed(1),
            trend: (newerReport.metadata.urlsByIssueType.Warning || 0) < (olderReport.metadata.urlsByIssueType.Warning || 0) ? 'improved' : 'worse'
          },
          Opportunity: {
            current: newerReport.metadata.urlsByIssueType.Opportunity || 0,
            previous: olderReport.metadata.urlsByIssueType.Opportunity || 0,
            change: (newerReport.metadata.urlsByIssueType.Opportunity || 0) - (olderReport.metadata.urlsByIssueType.Opportunity || 0),
            percentageChange: (((newerReport.metadata.urlsByIssueType.Opportunity || 0) - (olderReport.metadata.urlsByIssueType.Opportunity || 0)) / (olderReport.metadata.urlsByIssueType.Opportunity || 1) * 100).toFixed(1),
            trend: (newerReport.metadata.urlsByIssueType.Opportunity || 0) < (olderReport.metadata.urlsByIssueType.Opportunity || 0) ? 'improved' : 'worse'
          }
        }
      },
      issueChanges: newerReport.all_issues.map(currentIssue => {
        const previousIssue = olderReport.all_issues.find(
          pi => pi.issueName === currentIssue.issueName
        );

        const currentUrls = parseInt(currentIssue.urls);
        const previousUrls = previousIssue ? parseInt(previousIssue.urls) : 0;
        const change = currentUrls - previousUrls;
        const percentageChange = previousUrls ? ((change / previousUrls) * 100).toFixed(1) : '100';

        // Determine if change is positive or negative based on issue type
        const isPositiveChange = currentIssue.issueType === 'Opportunity' 
          ? change > 0  // For opportunities, more URLs is better
          : change < 0; // For issues/warnings, fewer URLs is better

        return {
          issueName: currentIssue.issueName,
          current: {
            urls: currentUrls,
            type: currentIssue.issueType,
            priority: currentIssue.issuePriority
          },
          previous: previousIssue ? {
            urls: previousUrls,
            type: previousIssue.issueType,
            priority: previousIssue.issuePriority
          } : null,
          change,
          percentageChange,
          trend: !previousIssue ? 'new' : 
            change === 0 ? 'unchanged' :
            isPositiveChange ? 'improved' : 'worse',
          indicator: !previousIssue ? '🆕' :
            change === 0 ? '⚪' :
            isPositiveChange ? '🟢' : '🔴'
        };
      }),
      summary: {
        improved: 0,
        worse: 0,
        unchanged: 0,
        new: 0,
        resolved: 0
      }
    };

    // Update summary counts
    comparison.issueChanges.forEach(issue => {
      comparison.summary[issue.trend]++;
    });

    comparison.summary.resolved = olderReport.all_issues.filter(prevIssue => 
      !newerReport.all_issues.find(curr => curr.issueName === prevIssue.issueName)
    ).length;

    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Comparison error:', error);
    return res.status(500).json({ 
      error: 'Failed to compare reports',
      details: error.message
    });
  }
} 