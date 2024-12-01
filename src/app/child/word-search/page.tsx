'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child, WordList } from '@/types';
import { getDocuments } from '@/lib/firebase/firebaseUtils';
import ChildDashboardLayout from '@/components/layouts/ChildDashboardLayout';
import WordSearch from '@/components/games/WordSearch';

export default function WordSearchPage() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const childData = localStorage.getItem('childUser');
    if (!childData) {
      router.push('/child/login');
      return;
    }
    const parsedChild = JSON.parse(childData);
    setChild(parsedChild);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!child) return;

      try {
        // First check for an AI-generated list in localStorage
        const aiList = localStorage.getItem('currentWordSearchList');
        if (aiList) {
          console.log('Found AI-generated word list:', JSON.parse(aiList));
          setWordList(JSON.parse(aiList));
          localStorage.removeItem('currentWordSearchList'); // Clear it after use
          return;
        }

        // If no AI list, fetch the active list
        const lists = await getDocuments('wordLists') as WordList[];
        console.log('All word lists:', lists);
        
        const activeLists = lists.filter(list => 
          list.assignedTo?.includes(child.id) && 
          list.isActive
        );
        
        console.log('Active lists for child:', activeLists);
        
        if (activeLists.length > 0) {
          const mostRecent = activeLists[activeLists.length - 1];
          console.log('Selected list:', mostRecent);
          setWordList(mostRecent);
        }
      } catch (error) {
        console.error('Error fetching word lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [child]);

  if (!child) return null;

  return (
    <ChildDashboardLayout>
      <div className="container mx-auto px-4">
        {!wordList ? (
          <>
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
                No active spell book found. Return to your spell books and choose one to practice!
              </p>
              <button
                onClick={() => router.push('/child/game')}
                className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
              >
                Back to Spell Books
              </button>
            </div>
          </>
        ) : (
          <WordSearch
            childId={child.id}
            onClose={() => router.push('/child/game')}
            wordList={wordList}
          />
        )}
      </div>
    </ChildDashboardLayout>
  );
} 