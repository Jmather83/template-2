'use client';

import Link from 'next/link';
import { clearTestHistory } from '@/lib/utils/clearTestHistory';
import { useState } from 'react';

export default function Header() {
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all test history? This cannot be undone.')) {
      setClearing(true);
      try {
        await clearTestHistory();
        alert('Test history cleared successfully!');
      } catch (error) {
        console.error('Error clearing test history:', error);
        alert('Failed to clear test history. Please try again.');
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-purple-800">
          SpellQuest Adventure
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition"
          >
            {clearing ? 'Clearing History...' : 'Clear Test History'}
          </button>
        </div>
      </div>
    </header>
  );
} 