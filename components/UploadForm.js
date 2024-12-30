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
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white">
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Domain Name *
          </label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter domain (e.g., example.com)"
            required
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Screaming Frog CSV File *
          </label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".csv"
            className="w-full p-2 border rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Please upload a CSV file exported from Screaming Frog
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>

        {message && (
          <div className={`p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
} 