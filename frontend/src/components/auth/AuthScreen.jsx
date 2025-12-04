// src/components/auth/AuthScreen.jsx
import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { signup, login } from '../../api/authApi.js';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;

      if (isLogin) {
        // LOGIN
        data = await login({ email, password });
      } else {
        // SIGNUP
        data = await signup({ name, email, password });
      }

      // Save token
      localStorage.setItem('teamsync_token', data.token);

      // Update app state
      onLogin(data.user);
    } catch (err) {
      console.error('Auth error:', err);
      const msg =
        err.response?.data?.message ||
        (isLogin ? 'Failed to log in' : 'Failed to sign up');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
          <MessageSquare size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">TeamSync</h1>
      </div>

      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Welcome back' : 'Create your workspace'}
        </h2>
        <p className="text-gray-500 mb-6">
          {isLogin
            ? 'Enter your details to access your workspace.'
            : 'Get started with a free account today.'}
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full mt-4" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
