import React from 'react';

const IssuePopup = ({ issue, onClose }) => {
  if (!issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4">{issue['Issue Name']}</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <span className="font-semibold">Type: </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                issue['Issue Type'] === 'Issue' ? 'bg-red-100 text-red-800' : 
                issue['Issue Type'] === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {issue['Issue Type']}
              </span>
            </div>
            <div>
              <span className="font-semibold">Priority: </span>
              <span>{issue['Issue Priority']}</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div>
              <span className="font-semibold">URLs Affected: </span>
              <span>{issue['URLs']}</span>
            </div>
            <div>
              <span className="font-semibold">Percentage of Total: </span>
              <span>{issue['% of Total']}%</span>
            </div>
          </div>

          {issue.description && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
              </div>
            </div>
          )}

          {issue.howToFix && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">How to Fix</h3>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 whitespace-pre-wrap">{issue.howToFix}</p>
              </div>
            </div>
          )}

          {issue.helpUrl && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Help Resources</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <a 
                  href={issue.helpUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Documentation
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuePopup;
