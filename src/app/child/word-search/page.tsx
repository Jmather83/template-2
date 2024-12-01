'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child } from '@/types';
import ChildDashboardLayout from '@/components/layouts/ChildDashboardLayout';
import WordSearch from '@/components/games/WordSearch';

export default function WordSearchPage() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [showWordSearch, setShowWordSearch] = useState(false);

  useEffect(() => {
    const childData = localStorage.getItem('childUser');
    if (!childData) {
      router.push('/child/login');
      return;
    }
    const parsedChild = JSON.parse(childData);
    setChild(parsedChild);
  }, [router]);

  if (!child) return null;

  return (
    <ChildDashboardLayout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">
              Magical Word Search
            </h1>
            <p className="text-gray-600">Find the hidden words from your latest spell book!</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-6">
            Challenge yourself to find all the words from your most recent spell list.
            They might be hidden horizontally, vertically, or diagonally!
          </p>
          <button
            onClick={() => setShowWordSearch(true)}
            className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
          >
            Start Word Search
          </button>
        </div>

        {showWordSearch && child && (
          <WordSearch
            childId={child.id}
            onClose={() => setShowWordSearch(false)}
          />
        )}
      </div>
    </ChildDashboardLayout>
  );
} 