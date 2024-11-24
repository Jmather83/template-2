'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDocuments } from '@/lib/firebase/firebaseUtils';
import { Child } from '@/types';
import Header from '@/components/layouts/Header';

export default function ChildLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const children = await getDocuments('children') as Child[];
      const child = children.find(
        (c) => c.username === username && c.pin === pin
      );

      if (child) {
        localStorage.setItem('childUser', JSON.stringify(child));
        router.push('/child/game');
      } else {
        setError('Invalid username or PIN');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <Header />
      <div className="flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">
            Welcome, Young Wizard!
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wizard Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter your magical name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter your 4-digit PIN"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
              >
                Start Adventure
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 