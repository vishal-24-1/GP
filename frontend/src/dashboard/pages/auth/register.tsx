import React, { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { ChalkboardTeacher, ArrowLeft } from '@phosphor-icons/react';

import educatorSignupImg from '../../../assets/images/educatorlogin.svg';
import { setNewPassword } from '../../../context/AuthContext';

// Defining the interface for the component's state
interface FormData {
  fullName: string;
  dob: string;
  institutionName: string;
  educatorEmail: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  errorMessage: string | null;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dob: '',
    institutionName: '',
    educatorEmail: '',
    password: '',
    confirmPassword: '',
    loading: false,
    errorMessage: null,
  });

  // Handle changes for text input fields
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // useEffect hook for side effects like setting document title and handling initial redirects
  useEffect(() => {
    document.title = "Signup | Learning Platform"; // Set the document title

    const storedEmail = localStorage.getItem('educator_email'); // Get stored educator email

    // If an email is found in local storage, pre-fill the email field
    if (storedEmail) {
      setFormData(prev => ({ ...prev, educatorEmail: storedEmail }));
    }
  }, [navigate]); // Dependency array includes navigate to ensure effect re-runs if navigate changes (though it's stable)

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setFormData(prev => ({ ...prev, errorMessage: 'Passwords do not match' }));
      return;
    }

    setFormData(prev => ({ ...prev, loading: true, errorMessage: null }));

    try {
      setNewPassword(formData.password); // <-- Set password in AuthContext/localStorage
      localStorage.setItem('token', 'dummy_token_lokesh');
      localStorage.setItem('first_time_login', 'false');

      // Navigate to the educator login page after successful registration as requested.
      navigate('/login'); // <-- FIXED: was /auth/login
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        errorMessage: 'Something went wrong. Please try again.',
      }));
    } finally {
      // Always set loading state back to false after the request completes (success or failure)
      setFormData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-blue-50">
      {/* Main content card */}
      <div className="flex flex-1 items-center justify-center relative z-10 py-12 px-4">
        <motion.div
          className="card relative bg-white shadow-xl w-full max-w-md backdrop-blur-sm bg-opacity-95 p-8"
          initial={{ opacity: 0 }} // Initial animation state
          animate={{ opacity: 1 }} // Animation target state
          transition={{ duration: 0.6, ease: 'easeOut' }} // Animation duration and easing
        >
          {/* Back button */}
          <motion.button
            onClick={() => navigate('/login')} // <-- FIXED: was /auth/login
            className="absolute top-4 left-4 btn btn-sm btn-base-100 btn-circle text-blue-700"
            aria-label="Go back"
          >
            <ArrowLeft size={18} weight="bold" />
          </motion.button>

          {/* Card body content */}
          <div className="card-body pt-6">
            <div className="flex items-center justify-center mb-4">
              <ChalkboardTeacher weight="duotone" size={32} className="text-primary mr-2" />
              <h2 className="text-2xl font-bold text-center text-blue-800">Signup</h2>
            </div>

            <p className="text-center p-2 text-blue-700 italic">
              Join us, esteemed educator! Create your account and start inspiring minds.
            </p>

            {/* Illustration */}
            <div className="w-4/5 mx-auto flex justify-center items-center p-4">
              <motion.img
                src={educatorSignupImg}
                alt="Signup"
                className="w-full object-contain"
              />
            </div>

            {/* Display error message if any */}
            {formData.errorMessage && (
              <p className="text-red-500 text-sm text-center">{formData.errorMessage}</p>
            )}

            {/* Signup form */}
            <form className="w-full flex flex-col space-y-4 mt-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
              <input
                type="email"
                name="educatorEmail"
                placeholder="Email Address"
                value={formData.educatorEmail}
                onChange={handleChange}
                className="input input-bordered w-full"
                readOnly // Email is pre-filled and should not be editable
              />
              <input
                type="date"
                name="dob"
                placeholder="Date of Birth"
                value={formData.dob}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
              <input
                type="text"
                name="institutionName"
                placeholder="Institution Name"
                value={formData.institutionName}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
              <motion.div>
                <button
                  type="submit"
                  className="btn btn-outline btn-primary btn-wide w-full"
                  disabled={formData.loading} // Disable button when loading
                >
                  {formData.loading ? 'Signing Up...' : 'Sign Up'}
                </button>
              </motion.div>
            </form>
            <div className="flex flex-col items-center space-y-2 mt-4">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate('/login')} // <-- FIXED: was /auth/login
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-2 text-center text-blue-700 bg-blue-100 text-xs z-10">
        © 2025 Learning Platform. All rights reserved.
      </div>
    </div>
  );
};

export default Signup;
