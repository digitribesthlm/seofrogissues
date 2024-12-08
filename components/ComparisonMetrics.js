export default function ComparisonMetrics({ comparison }) {
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improved': return 'text-green-600';
      case 'worse': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improved': return '↓';
      case 'worse': return '↑';
      default: return '→';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Issues Card with Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 mb-4">
          Comparing:
          <span className="font-medium ml-1">{comparison.dates.formattedCurrent}</span>
          <span className="mx-2">vs</span>
          <span className="font-medium">{comparison.dates.formattedPrevious}</span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">Total Issues</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900">
            {comparison.metrics.totalIssues.current}
          </p>
          <div className={`flex items-center ${getTrendColor(comparison.metrics.totalIssues.trend)}`}>
            <span className="text-xl font-bold mr-1">
              {getTrendIcon(comparison.metrics.totalIssues.trend)}
            </span>
            <span className="text-sm">
              {comparison.metrics.totalIssues.percentageChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Total URLs Card with Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 mb-4">
          Comparing:
          <span className="font-medium ml-1">{comparison.dates.formattedCurrent}</span>
          <span className="mx-2">vs</span>
          <span className="font-medium">{comparison.dates.formattedPrevious}</span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">Total Affected URLs</h3>
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900">
            {comparison.metrics.totalUrls.current}
          </p>
          <div className={`flex items-center ${getTrendColor(comparison.metrics.totalUrls.trend)}`}>
            <span className="text-xl font-bold mr-1">
              {getTrendIcon(comparison.metrics.totalUrls.trend)}
            </span>
            <span className="text-sm">
              {comparison.metrics.totalUrls.percentageChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Issues by Type with Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 mb-4">
          Comparing:
          <span className="font-medium ml-1">{comparison.dates.formattedCurrent}</span>
          <span className="mx-2">vs</span>
          <span className="font-medium">{comparison.dates.formattedPrevious}</span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">Issues by Type</h3>
        <div className="mt-2 space-y-2">
          {Object.entries(comparison.metrics.byType).map(([type, data]) => (
            <div key={type} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{type}</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold mr-2">{data.current}</span>
                <span className={`text-xs ${getTrendColor(data.trend)}`}>
                  {getTrendIcon(data.trend)} {data.percentageChange}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-500 mb-4">
          Comparing:
          <span className="font-medium ml-1">{comparison.dates.formattedCurrent}</span>
          <span className="mx-2">vs</span>
          <span className="font-medium">{comparison.dates.formattedPrevious}</span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">Changes Summary</h3>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-600">Improved</span>
            <span className="text-sm font-semibold">{comparison.summary.improved}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-600">Worse</span>
            <span className="text-sm font-semibold">{comparison.summary.worse}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">New Issues</span>
            <span className="text-sm font-semibold">{comparison.summary.new}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-600">Resolved</span>
            <span className="text-sm font-semibold">{comparison.summary.resolved}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 