import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Ensure this path is correct

import { motion } from 'framer-motion';
import {
  EnvelopeSimple, // Changed from User to EnvelopeSimple for email icon
  LockSimple,
  Eye,
  EyeSlash,
  Plus,
} from '@phosphor-icons/react';

// IMPORTANT: Replace this with the ACTUAL path to the illustration in your assets
// that perfectly matches the one in your screenshot.
// If it's the exact image_9af20e.png you provided, you might need to extract the SVG/PNG illustration
// from it or ensure LoginIllustration points to that specific image.
import LoginIllustration from '../../../assets/images/educatorlogin.svg'; // Placeholder name, adjust as needed

const Login: React.FC = () => {
  const { login } = useAuth(); // Assuming useAuth provides a login function
  const [educatorId, setEducatorId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Educator Portal'; // Matches the header text more closely
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- FOR DEMO/TESTING ONLY ---
    // In a real app, you wouldn't clear localStorage like this
    // It's here from previous versions, ensure it's suitable for your testing
    localStorage.removeItem('inzight_auth');
    localStorage.removeItem('inzight_first_login');
    // --- END DEMO/TESTING ---

    const success = await login(educatorId, password);
    if (!success) {
      setError('Invalid username or password'); // Match error message if needed
    } else {
      // Handle successful login, e.g., navigate to dashboard
      // navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-10 px-4 overflow-hidden"> {/* Light blue background */}
      <motion.div
        className="relative bg-white shadow-xl rounded-xl w-full max-w-md overflow-hidden" // Card styling
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <div className="bg-blue-600 text-white py-5 px-6 flex items-center relative">
          {/* <button
            onClick={() => navigate(-1)} // Navigate back
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-blue-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} weight="bold" />
          </button> */}
          <div className="flex-1 text-center pr-8"> {/* pr-8 for balance with left arrow */}
            <h2 className="text-xl font-semibold">Educator Portal</h2> {/* Font weight adjusted to match image */}
            <p className="text-sm text-blue-100 mt-0.5">Sign in to manage your courses and students</p> {/* Reduced margin-top */}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {/* Illustration */}
          <motion.div
            className="flex justify-center mb-6" // Adjust margin-bottom if needed
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* IMPORTANT: Ensure LoginIllustration points to the correct image file */}
            <img src={LoginIllustration} alt="Educator Login Illustration" className="h-32 object-contain" />
          </motion.div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4 font-medium">{error}</p>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}> {/* Adjusted spacing */}
            {/* Educator Email Input */}
            <div>
              <label htmlFor="educator-email" className="block text-sm font-medium text-gray-700 mb-2">Educator Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="educator-email"
                  placeholder="your@email.com" // Matches image placeholder
                  value={educatorId}
                  onChange={(e) => setEducatorId(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-100 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none" // Added outline-none
                  required
                  aria-label="Educator Email"
                />
                <EnvelopeSimple size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" /> {/* Envelope icon */}
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="********" // Matches image placeholder
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-2 w-full border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none" // Added outline-none
                  required
                  aria-label="Password"
                />
                <LockSimple size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
              <div className="text-right mt-2">
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
              </div>
            </div>

            {/* Access Dashboard Button */}
            <motion.button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-base font-semibold transition-colors shadow-md" // Added shadow-md
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Plus size={20} weight="bold" /> Access Dashboard
            </motion.button>
          </form>

          {/* Help & Support Link */}
          <div className="text-center mt-6 text-sm text-gray-600">
            Need help?{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium"> {/* Font medium for the link part */}
              Contact educator support
            </a>
          </div>

          {/* Internal Copyright Footer */}
          <div className="text-center mt-6 text-xs text-gray-500">
            © 2025 Learning Platform
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;