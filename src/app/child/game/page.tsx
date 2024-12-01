'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child, WordList } from '@/types';
import Header from '@/components/layouts/Header';
import { Wand2, Book, Trophy, LogOut, User, X } from 'lucide-react';
import CharacterCustomiser from '@/components/character/CharacterCustomiser';
import { getDocuments, updateDocument } from '@/lib/firebase/firebaseUtils';
import SpellPractice from '@/components/practice/SpellPractice';
import TestHistoryDialog from '@/components/practice/TestHistoryDialog';
import ChildDashboardLayout from '@/components/layouts/ChildDashboardLayout';

export default function ChildDashboard() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [showCustomiser, setShowCustomiser] = useState(false);
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [showWordLists, setShowWordLists] = useState(false);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [showTestHistory, setShowTestHistory] = useState(false);

  useEffect(() => {
    const childData = localStorage.getItem('childUser');
    if (!childData) {
      router.push('/child/login');
      return;
    }
    const parsedChild = JSON.parse(childData);
    if (!parsedChild.testHistory) {
      parsedChild.testHistory = [];
      localStorage.setItem('childUser', JSON.stringify(parsedChild));
    }
    setChild(parsedChild);

    // Fetch assigned word lists
    const fetchWordLists = async () => {
      try {
        const lists = await getDocuments('wordLists') as WordList[];
        const assignedLists = lists.filter(list => 
          list.assignedTo?.includes(parsedChild.id) &&
          list.difficulty === parsedChild.difficultyLevel
        );
        setWordLists(assignedLists);
      } catch (err) {
        console.error('Error fetching word lists:', err);
      }
    };

    fetchWordLists();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('childUser');
    router.push('/');
  };

  const handleCustomiserClick = () => {
    console.log('Opening customiser modal');
    setShowCustomiser(true);
  };

  const handlePracticeComplete = async (score: number) => {
    try {
      // Refresh child data after practice
      const childData = localStorage.getItem('childUser');
      if (childData) {
        const updatedChild = JSON.parse(childData);
        setChild(updatedChild);
      }
      setShowPractice(false);
      setSelectedList(null);
      setShowWordLists(true);
    } catch (error) {
      console.error('Error updating child data:', error);
    }
  };

  const WordListModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Your Spell Books</h2>
          <button
            onClick={() => setShowWordLists(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {wordLists.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No active spell books assigned yet. Ask your parent to assign some!
          </p>
        ) : (
          <div className="grid gap-4">
            {wordLists.map((list) => (
              <div
                key={list.id}
                className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition cursor-pointer"
                onClick={() => {
                  setSelectedList(list);
                  setShowPractice(true);
                  setShowWordLists(false);
                }}
              >
                <h3 className="text-lg font-semibold text-purple-800">{list.name}</h3>
                <p className="text-sm text-gray-600">Category: {list.category}</p>
                <p className="text-sm text-gray-600">
                  Difficulty: {list.difficulty}
                </p>
                <p className="text-sm text-gray-600">Words: {list.words.length}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!child) return null;

  return (
    <ChildDashboardLayout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">
              Welcome, {child.displayName}!
            </h1>
            <p className="text-gray-600">Level: {child.difficultyLevel}</p>
          </div>
          <button
            onClick={handleCustomiserClick}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
          >
            <User size={20} />
            Customise Character
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Wand2 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold">Practice Spells</h2>
            </div>
            <p className="text-gray-600">Master new words and earn magical powers!</p>
          </div>

          <div 
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
            onClick={() => setShowWordLists(true)}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Book className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Spell Books</h2>
            </div>
            <p className="text-gray-600">
              {wordLists.length} {wordLists.length === 1 ? 'book' : 'books'} available
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold">Achievements</h2>
            </div>
            <p className="text-gray-600">See your progress and earned rewards</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{child.progress.coins}</p>
              <p className="text-gray-600">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{child.progress.gems}</p>
              <p className="text-gray-600">Gems</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{child.progress.completedQuests}</p>
              <p className="text-gray-600">Quests</p>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-purple-50 rounded-lg p-2 transition"
              onClick={() => setShowTestHistory(true)}
            >
              <p className="text-3xl font-bold text-yellow-600">{child.progress.accuracy}%</p>
              <p className="text-gray-600">Accuracy</p>
            </div>
          </div>
        </div>

        {showCustomiser && child && (
          <CharacterCustomiser
            child={child}
            onClose={() => setShowCustomiser(false)}
          />
        )}

        {showWordLists && <WordListModal />}

        {showPractice && selectedList && child && (
          <SpellPractice
            child={child}
            onClose={() => {
              setShowPractice(false);
              setSelectedList(null);
              setShowWordLists(true);
            }}
            onComplete={handlePracticeComplete}
          />
        )}

        {showTestHistory && child && (
          <TestHistoryDialog
            childId={child.id}
            onClose={() => setShowTestHistory(false)}
          />
        )}
      </div>
    </ChildDashboardLayout>
  );
} 