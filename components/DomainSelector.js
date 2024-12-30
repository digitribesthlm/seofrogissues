import { useState, useEffect } from 'react';

export default function DomainSelector({ onDomainChange }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/domains');
        const data = await response.json();
        if (response.ok) {
          setDomains(data.domains);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Error fetching domains');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  if (loading) return <div>Loading domains...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Select Domain</label>
      <select
        onChange={(e) => onDomainChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Select a domain</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </select>
    </div>
  );
} 