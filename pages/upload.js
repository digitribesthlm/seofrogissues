import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import UploadForm from '../components/UploadForm';

export default function Upload() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upload SEO Report</h1>
        <UploadForm />
      </div>
    </DashboardLayout>
  );
}
