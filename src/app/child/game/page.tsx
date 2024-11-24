'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child } from '@/types';
import Header from '@/components/layouts/Header';
import { Wand2, Book, Trophy, LogOut, User } from 'lucide-react';
import CharacterCustomiser from '@/components/character/CharacterCustomiser';

export default function ChildDashboard() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [showCustomiser, setShowCustomiser] = useState(false);

  useEffect(() => {
    const childData = localStorage.getItem('childUser');
    if (!childData) {
      router.push('/child/login');
      return;
    }
    setChild(JSON.parse(childData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('childUser');
    router.push('/');
  };

  const handleCustomiserClick = () => {
    console.log('Opening customiser modal');
    setShowCustomiser(true);
  };

  if (!child) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">
              Welcome, {child.displayName}!
            </h1>
            <p className="text-gray-600">Level: {child.difficultyLevel}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleCustomiserClick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
            >
              <User size={20} />
              Customise Character
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
            >
              <LogOut size={20} />
              Exit Game
            </button>
          </div>
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

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Book className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Spell Book</h2>
            </div>
            <p className="text-gray-600">View your word lists and practice previous spells</p>
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
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{child.progress.accuracy}%</p>
              <p className="text-gray-600">Accuracy</p>
            </div>
          </div>
        </div>

        {showCustomiser && child && (
          <CharacterCustomiser
            child={child}
            onClose={() => {
              console.log('Closing customiser modal');
              setShowCustomiser(false);
            }}
          />
        )}
      </div>
    </div>
  );
} 