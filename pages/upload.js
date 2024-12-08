import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      console.log('Raw file content:', text.substring(0, 500)); // Let's see the raw content

      // Split into lines and remove empty lines
      const rows = text
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(row => row.length > 0);

      console.log('Total rows found:', rows.length);
      console.log('First few rows:', rows.slice(0, 3));

      // Parse headers
      const headerRow = rows[0];
      const headers = headerRow
        .split(',')
        .map(h => h.replace(/^"(.+)"$/, '$1').trim());

      console.log('Headers:', headers);

      // Parse data rows
      const records = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Split by comma but respect quotes
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        
        // Clean up the values
        const cleanValues = values.map(val => val.replace(/^"(.*)"$/, '$1').trim());

        if (cleanValues.length === headers.length) {
          const record = {};
          headers.forEach((header, index) => {
            record[header] = cleanValues[index];
          });
          records.push(record);
        } else {
          console.warn(`Skipping row ${i}, wrong number of fields:`, {
            row,
            expected: headers.length,
            got: cleanValues.length
          });
        }
      }

      console.log('Parsed records:', records.length);
      console.log('First record:', records[0]);
      console.log('Last record:', records[records.length - 1]);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Successfully uploaded ${records.length} records!`);
        setFile(null);
        e.target.reset();
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Upload SEO Report
          </h1>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SEO Report File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".csv"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV files from Screaming Frog</p>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`rounded-md p-4 ${
                    message.includes('success')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <p>{message}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                      ${uploading || !file
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 