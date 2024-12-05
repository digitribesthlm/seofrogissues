import React from 'react';
import { getIssueGroup } from '../utils/seoUtils';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  'High': '#F87171',
  'Medium': '#34D399',
  'Low': '#60A5FA',
  'Other': '#9CA3AF'
};

export default function IssueCharts({ data }) {
  // Prepare data for category distribution chart
  const categoryData = Object.entries(data.issues.reduce((acc, issue) => {
    const group = getIssueGroup(issue['Issue Name']);
    const urlCount = parseInt(issue['URLs'].replace(/[^0-9]/g, '')) || 0;
    acc[group] = (acc[group] || 0) + urlCount;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  // Prepare data for priority distribution
  const priorityData = Object.entries(data.issues.reduce((acc, issue) => {
    const priority = issue['Issue Priority'];
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Issues by Category</h3>
        <div className="h-[500px] flex items-center">
          <ResponsiveContainer width="100%" height="95%">
            <BarChart
              data={categoryData}
              margin={{ top: 20, right: 30, left: 30, bottom: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#60A5FA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Issues by Priority</h3>
        <div className="h-[500px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="95%">
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={180}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry) => (
                  <Cell 
                    key={entry.name}
                    fill={COLORS[entry.name] || COLORS.Other}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 