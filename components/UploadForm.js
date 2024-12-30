import { useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Domain:', domain);
    console.log('File:', file);

    if (!file || !domain) {
      setMessage('Please select a file and enter a domain');
      return;
    }

    // Verify file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage('Please upload a CSV file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('domain', domain);
    
    // Read and parse the CSV file
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {
        const csvContent = e.target.result;
        const records = csvContent.split('\n').slice(1).map(line => {
          const [issueName, issueType, issuePriority, urls, percentageOfTotal] = line.split(',');
          return {
            'Issue Name': issueName,
            'Issue Type': issueType,
            'Issue Priority': issuePriority,
            'URLs': urls,
            '% of Total': percentageOfTotal
          };
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain,
            records
          }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setMessage('File uploaded successfully');
          setFile(null);
          setDomain('');
        } else {
          setMessage(data.error || 'Error uploading file');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage('Error uploading file');
      } finally {
        setLoading(false);
      }
    };

    fileReader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2">
            Domain Name *
          </label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter domain (e.g., example.com)"
            required
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
            Screaming Frog CSV File *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".csv"
                    className="sr-only"
                    required
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV files from Screaming Frog</p>
              {file && (
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : 'Upload'}
        </button>

        {message && (
          <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </form>
    </div>
  );
}