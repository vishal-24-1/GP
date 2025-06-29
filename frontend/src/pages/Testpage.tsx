import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Define the type for your chart data objects
interface ChartDataItem {
  testCode: string;
  averageScore: number;
}

// Average Score Chart Page Component - Now the main component
const Testpage = () => { // Renamed AverageScoreChartPage to App as it's the sole component
  // Explicitly type the state for chartData
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Explicitly type the state for error to be string or null
  const [error, setError] = useState<string | null>(null);

  // Endpoint for your Django API
  // IMPORTANT: Ensure this URL matches your Django project's actual URL for the API endpoint
  const API_ENDPOINT = 'http://127.0.0.1:8000/api/average-scores-by-test/';

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          const errorText = await response.text(); 
          throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText}`);
        }
        // Explicitly cast the incoming JSON data to ChartDataItem[]
        const data: ChartDataItem[] = await response.json();
        if (Array.isArray(data)) {
          setChartData(data);
        } else {
          throw new Error('Received data is not an array. Expected a list of objects.');
        }
      } catch (e: any) { // Catch 'e' as 'any' or 'unknown' and then narrow down
        console.error("Error fetching chart data:", e);
        // Ensure error message is always a string
        setError(`Failed to load data: ${e.message || e}. Please ensure the Django server is running, the API endpoint is correct, and data is loaded into your backend models.`);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []); // Empty dependency array means this runs once on mount

  // Conditional rendering based on loading, error, or data availability
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
        <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-6 text-2xl font-semibold text-indigo-700">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
        <div className="bg-red-100 border border-red-500 text-red-800 px-8 py-6 rounded-xl shadow-2xl text-center max-w-lg w-full transform transition-all duration-300 hover:scale-105">
          <strong className="font-extrabold text-3xl block mb-2">Oops! Error Loading Data</strong>
          <p className="text-xl leading-relaxed">{error}</p>
          <p className="mt-4 text-md text-red-700">
            Please ensure your Django server is running and the API endpoint 
            <code className="bg-red-200 text-red-900 p-1 rounded-md text-sm mx-1 font-mono break-all">{API_ENDPOINT}</code> 
            is correct and accessible.
          </p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
        <div className="bg-yellow-100 border border-yellow-500 text-yellow-800 px-8 py-6 rounded-xl shadow-2xl text-center max-w-lg w-full transform transition-all duration-300 hover:scale-105">
          <strong className="font-extrabold text-3xl block mb-2">No Data Available!</strong>
          <p className="text-xl leading-relaxed">
            No average score data found. This might mean the data hasn't been loaded into your Django backend yet, or there are no responses in the database.
          </p>
          <p className="mt-4 text-md text-yellow-700">
            To load data, visit this URL in your browser: <code className="bg-yellow-200 text-yellow-900 p-1 rounded-md text-sm mx-1 font-mono break-all">http://127.0.0.1:8000/api/load-all-data/</code>.
          </p>
        </div>
      </div>
    );
  }

  // Render the chart if data is available
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-2xl max-w-4xl w-full transform transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-4xl font-extrabold text-indigo-800 mb-8 text-center leading-tight">
          Average Test Scores
        </h2>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={chartData}
            margin={{
              top: 30, right: 30, left: 20, bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#e0e7ff" />
            <XAxis
              dataKey="testCode"
              stroke="#4338ca" // Tailwind indigo-700
              tickLine={false}
              axisLine={{ strokeWidth: 2, stroke: '#6366f1' }} // Tailwind indigo-500
              tick={{ fill: '#4a5568', fontSize: 13 }}
              interval={0} // Show all ticks
              angle={-45} // Angle for better label readability if many tests
              textAnchor="end"
              height={80} // Give more space for rotated labels
              label={{ value: 'Test Code', position: 'insideBottom', offset: -10, fill: '#4a5568', fontSize: 16 }}
            />
            <YAxis
              stroke="#4338ca" // Tailwind indigo-700
              tickLine={false}
              axisLine={{ strokeWidth: 2, stroke: '#6366f1' }} // Tailwind indigo-500
              tick={{ fill: '#4a5568', fontSize: 13 }}
              label={{ value: 'Average Score', angle: -90, position: 'insideLeft', fill: '#4a5568', fontSize: 16, offset: 10 }}
              domain={[0, 'auto']} // Ensure Y-axis starts at 0
            />
            <Tooltip 
              cursor={{ fill: 'rgba(99, 102, 241, 0.2)' }} // Light indigo overlay
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #c7d2fe', // Light indigo border
                borderRadius: '12px', 
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                padding: '12px 16px'
              }} 
              itemStyle={{ color: '#374151', fontSize: 15, fontWeight: 'medium' }} 
              labelStyle={{ color: '#1f2937', fontWeight: 'bold', fontSize: 16, marginBottom: '4px' }}
              // Explicitly type 'value' to ensure toFixed is available
              formatter={(value: number, name, props) => [`${value.toFixed(2)}`, 'Avg. Score']}
              labelFormatter={(label: string) => `Test Code: ${label}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '30px', fontSize: 15, color: '#4a5568' }} 
              iconType="circle"
              formatter={(value) => <span className="text-gray-700 font-medium">{value === 'averageScore' ? 'Average Score' : value}</span>}
            />
            <Bar
              dataKey="averageScore"
              fill="#6366f1" // Tailwind indigo-500
              barSize={50} // Slightly larger bars
              radius={[10, 10, 0, 0]} // Rounded top corners
              activeBar={{ fill: '#4f46e5' }} // Darker indigo on hover
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Testpage;
