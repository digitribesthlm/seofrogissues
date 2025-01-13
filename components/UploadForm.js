import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.isAuthenticated) {
          router.push('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const parseCsvLine = (line) => {
    const values = [];
    let currentValue = '';
    let withinQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (withinQuotes && line[i + 1] === '"') {
          // Handle escaped quotes (two double quotes in a row)
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          withinQuotes = !withinQuotes;
        }
      } else if (char === ',' && !withinQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    // Clean the values
    return values.map(val => {
      // Remove surrounding quotes and trim
      val = val.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      // Handle escaped quotes
      val = val.replace(/""/g, '"');
      return val;
    });
  };

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
    setMessage('');
    
    // Read and parse the CSV file
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {
        const csvContent = e.target.result;
        // Split by newlines but preserve newlines within quoted fields
        const lines = csvContent
          .split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        console.log('CSV Header:', lines[0]); // Log header for debugging
        
        // Skip header row and parse each line
        const records = lines.slice(1).map(line => {
          console.log('Processing line:', line);
          const values = parseCsvLine(line);
          console.log('Parsed values:', values);
          
          // Map values to their corresponding columns
          const record = {
            'Issue Name': values[0] || '',
            'Issue Type': values[1] || '',
            'Issue Priority': values[2] || '',
            'URLs': values[3] || '',
            '% of Total': values[4] || '',
            'Description': values[5] || '',
            'How To Fix': values[6] || '',
            'Help URL': values[7] || ''
          };
          
          console.log('Created record:', record);
          return record;
        }).filter(record => record['Issue Name']);

        console.log('Final parsed records:', records);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain,
            records
          }),
          credentials: 'include' // Important: include cookies in the request
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setMessage('File uploaded successfully');
          setFile(null);
          setDomain('');
        } else if (response.status === 401) {
          // Redirect to login page if not authenticated
          router.push('/login');
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

  if (!isAuthenticated) {
    return null; // Don't render anything while checking authentication
  }

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
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a file</span>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV file only</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="text-sm text-gray-500">
            Selected file: {file.name}
          </div>
        )}

        {message && (
          <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}