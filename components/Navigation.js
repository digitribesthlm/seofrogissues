import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-white">
              SEO Dashboard
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/mongo"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Upload Report
              </Link>
              <Link
                href="/templates"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Issue Templates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 