import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Welcome, Lokesh!</h1>
        <p className="mb-8 text-blue-600">This is your dashboard. You are logged in.</p>
        <button
          onClick={logout}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
