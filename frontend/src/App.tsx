import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from '@/lib/DashboardFilterContext';
import Layout from './dashboard/components/Layout/Layout';
import {
  Section1Dashboard,
  IndividualQuestions,
  Performancetab,
  PerformanceInsights,
  Upload,
  Login,
  Register
} from './dashboard/pages/index.tsx';
import { useAuth } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/auth" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Section1Dashboard />} />
              <Route path="individual-questions" element={<IndividualQuestions />} />
              <Route path="performance" element={<Performancetab />} />
              <Route path="upload" element={<Upload />} />
              <Route path="performance-insights" element={<PerformanceInsights />} />
            </Route>
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </Router>
  );
}

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default App;