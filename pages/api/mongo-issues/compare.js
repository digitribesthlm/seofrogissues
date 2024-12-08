import { connectToDatabase } from '../../../utils/mongodb';
import { verifyAuth } from '../../../utils/auth';
import { calculateTotalSEOScore } from '../../../utils/seoUtils';

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

    // Get all reports
    const allReports = await db.collection('frog_seoReports')
      .find({ clientId: auth.clientId })
      .toArray();

    // Sort reports by date explicitly
    const sortedReports = allReports.sort((a, b) => 
      new Date(b.scan_date) - new Date(a.scan_date)
    );

    // Take the two most recent
    const [newestReport, previousReport] = sortedReports;

    console.log('Comparison dates:', {
      newest: new Date(newestReport.scan_date).toISOString(),
      previous: new Date(previousReport.scan_date).toISOString()
    });

    // Transform MongoDB data to match the format expected by calculateTotalSEOScore
    const transformIssues = (mongoIssues) => {
      return mongoIssues.map(issue => ({
        'Issue Name': issue.issueName,
        'Issue Type': issue.issueType,
        'Issue Priority': issue.issuePriority,
        'URLs': issue.urls,
        '% of Total': issue.percentageOfTotal
      }));
    };

    // Then use it in the calculation
    const newestScore = calculateTotalSEOScore(transformIssues(newestReport.all_issues));
    const previousScore = calculateTotalSEOScore(transformIssues(previousReport.all_issues));

    console.log('Real SEO Scores:', {
      newest: newestScore,
      previous: previousScore,
      difference: newestScore - previousScore
    });

    // Use these for comparison
    const comparison = {
      dates: {
        current: newestReport.scan_date,
        previous: previousReport.scan_date,
        daysBetween: Math.floor((new Date(newestReport.scan_date) - new Date(previousReport.scan_date)) / (1000 * 60 * 60 * 24)),
        formattedCurrent: new Date(newestReport.scan_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        formattedPrevious: new Date(previousReport.scan_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      metrics: {
        totalIssues: {
          current: newestReport.metadata.totalIssues,
          previous: previousReport.metadata.totalIssues,
          change: newestReport.metadata.totalIssues - previousReport.metadata.totalIssues,
          percentageChange: ((newestReport.metadata.totalIssues - previousReport.metadata.totalIssues) / previousReport.metadata.totalIssues * 100).toFixed(1),
          trend: newestReport.metadata.totalIssues < previousReport.metadata.totalIssues ? 'improved' : 'worse'
        },
        totalUrls: {
          current: newestReport.metadata.totalUrls,
          previous: previousReport.metadata.totalUrls,
          change: newestReport.metadata.totalUrls - previousReport.metadata.totalUrls,
          percentageChange: ((newestReport.metadata.totalUrls - previousReport.metadata.totalUrls) / previousReport.metadata.totalUrls * 100).toFixed(1),
          trend: newestReport.metadata.totalUrls < previousReport.metadata.totalUrls ? 'improved' : 'worse'
        },
        byType: {
          Issue: {
            current: newestReport.metadata.urlsByIssueType.Issue || 0,
            previous: previousReport.metadata.urlsByIssueType.Issue || 0,
            change: (newestReport.metadata.urlsByIssueType.Issue || 0) - (previousReport.metadata.urlsByIssueType.Issue || 0),
            percentageChange: (((newestReport.metadata.urlsByIssueType.Issue || 0) - (previousReport.metadata.urlsByIssueType.Issue || 0)) / (previousReport.metadata.urlsByIssueType.Issue || 1) * 100).toFixed(1),
            trend: (newestReport.metadata.urlsByIssueType.Issue || 0) < (previousReport.metadata.urlsByIssueType.Issue || 0) ? 'improved' : 'worse'
          },
          Warning: {
            current: newestReport.metadata.urlsByIssueType.Warning || 0,
            previous: previousReport.metadata.urlsByIssueType.Warning || 0,
            change: (newestReport.metadata.urlsByIssueType.Warning || 0) - (previousReport.metadata.urlsByIssueType.Warning || 0),
            percentageChange: (((newestReport.metadata.urlsByIssueType.Warning || 0) - (previousReport.metadata.urlsByIssueType.Warning || 0)) / (previousReport.metadata.urlsByIssueType.Warning || 1) * 100).toFixed(1),
            trend: (newestReport.metadata.urlsByIssueType.Warning || 0) < (previousReport.metadata.urlsByIssueType.Warning || 0) ? 'improved' : 'worse'
          },
          Opportunity: {
            current: newestReport.metadata.urlsByIssueType.Opportunity || 0,
            previous: previousReport.metadata.urlsByIssueType.Opportunity || 0,
            change: (newestReport.metadata.urlsByIssueType.Opportunity || 0) - (previousReport.metadata.urlsByIssueType.Opportunity || 0),
            percentageChange: (((newestReport.metadata.urlsByIssueType.Opportunity || 0) - (previousReport.metadata.urlsByIssueType.Opportunity || 0)) / (previousReport.metadata.urlsByIssueType.Opportunity || 1) * 100).toFixed(1),
            trend: (newestReport.metadata.urlsByIssueType.Opportunity || 0) < (previousReport.metadata.urlsByIssueType.Opportunity || 0) ? 'improved' : 'worse'
          }
        }
      },
      issueChanges: newestReport.all_issues.map(currentIssue => {
        const previousIssue = previousReport.all_issues.find(
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
            change === 0 ? '��' :
            isPositiveChange ? '🟢' : '��'
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

    comparison.summary.resolved = previousReport.all_issues.filter(prevIssue => 
      !newestReport.all_issues.find(curr => curr.issueName === prevIssue.issueName)
    ).length;

    // Add debug log before sending response
    console.log('Sending comparison data:', {
      seoScore: {
        current: newestScore,
        previous: previousScore,
        change: newestScore - previousScore,
        percentageChange: ((newestScore - previousScore) / previousScore * 100).toFixed(1)
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        previousIssues: previousReport.all_issues,
        dates: comparison.dates,
        metrics: {
          ...comparison.metrics,
          seoScore: {
            current: newestScore,
            previous: previousScore,
            change: newestScore - previousScore,
            percentageChange: ((newestScore - previousScore) / previousScore * 100).toFixed(1),
            trend: newestScore > previousScore ? 'improved' : 'worse'
          }
        },
        issueChanges: comparison.issueChanges,
        summary: comparison.summary
      }
    });
  } catch (error) {
    console.error('Comparison error:', error);
    return res.status(500).json({ 
      error: 'Failed to compare reports',
      details: error.message
    });
  }
} 