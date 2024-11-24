'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      router.push('/parent/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowResetModal(false);
        setShowLoginModal(true);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const switchToResetPassword = () => {
    setShowLoginModal(false);
    setShowResetModal(true);
    setError('');
    setResetSuccess('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100">
      <div className="absolute top-4 right-4 space-x-4">
        {!user ? (
          <>
            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-block bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition border border-purple-600"
            >
              Login
            </button>
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition border border-purple-600"
            >
              Create Account
            </Link>
          </>
        ) : (
          <Link 
            href="/parent/dashboard"
            className="inline-block bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition border border-purple-600"
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800">Parent Login</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>

              <div className="mt-8 space-y-4 text-center">
                <button
                  type="button"
                  onClick={switchToResetPassword}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  Forgot Password?
                </button>

                <div className="text-sm text-gray-600">
                  <p>Don't have an account?{' '}
                    <Link 
                      href="/auth/signup"
                      className="text-purple-600 hover:text-purple-800"
                      onClick={() => setShowLoginModal(false)}
                    >
                      Create one here
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800">Reset Password</h2>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                  placeholder="Enter your email"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {resetSuccess && (
                <p className="text-green-500 text-sm text-center">{resetSuccess}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setShowLoginModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-purple-800 mb-6">
            SpellQuest Adventure
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Embark on a magical journey to master spelling!
          </p>
          
          <div className="space-y-4">
            {!user && (
              <p className="text-sm text-gray-500">
                Parents: Login or create an account to manage your child's learning adventure
              </p>
            )}
            
            <div className="mt-8">
              <Link
                href="/child/login"
                className="inline-block bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition"
              >
                Child Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
