'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child, WordList } from '@/types';
import Header from '@/components/layouts/Header';
import { Wand2, Book, Trophy, LogOut, User, Sparkles, Search, X } from 'lucide-react';
import CharacterCustomiser from '@/components/character/CharacterCustomiser';
import { getDocuments, updateDocument } from '@/lib/firebase/firebaseUtils';
import SpellPractice from '@/components/practice/SpellPractice';
import TestHistoryDialog from '@/components/practice/TestHistoryDialog';
import ChildDashboardLayout from '@/components/layouts/ChildDashboardLayout';
import dynamic from 'next/dynamic';

// Dynamically import confetti with no SSR
const confetti = dynamic(() => import('canvas-confetti'), {
  ssr: false
});

export default function ChildDashboard() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [showCustomiser, setShowCustomiser] = useState(false);
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [showWordLists, setShowWordLists] = useState(false);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [showTestHistory, setShowTestHistory] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

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
        console.log('All word lists:', lists);
        
        const assignedLists = lists.filter(list => {
          console.log('Checking list:', list.name, 'assignedTo:', list.assignedTo, 'isActive:', list.isActive);
          return list.assignedTo?.includes(parsedChild.id) && list.isActive === true;
        });
        
        console.log('Assigned and active lists:', assignedLists);
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
      // Only show word lists if not coming from AI practice
      if (!selectedList?.id?.startsWith('ai_')) {
        setShowWordLists(true);
      }
    } catch (error) {
      console.error('Error updating child data:', error);
    }
  };

  const handleMagicSpelling = async () => {
    console.log('Magic Spelling clicked - wordLists:', wordLists);
    if (wordLists.length > 0) {
      setShowProgress(true);
      setProgressMessage('Finding your active spell book...');

      // Get active lists
      const activeLists = wordLists.filter(list => {
        console.log('Checking list:', list.name, 'isActive:', list.isActive);
        return list.isActive === true;
      });
      console.log('Active lists found:', activeLists);

      if (activeLists.length === 0) {
        console.log('No active lists found');
        setShowProgress(false);
        alert('No active spell books found. Ask your parent to activate one!');
        return;
      }

      // Use the most recent active list
      const activeList = activeLists[activeLists.length - 1];
      console.log('Selected active list:', activeList);
      
      // Call handleGenerateAIList directly with the active list
      await handleGenerateAIList('spelling', activeList);
    } else {
      console.log('No word lists available');
      alert('No spelling lists available. Ask your parent to assign some!');
    }
  };

  const handleMagicWordSearch = async () => {
    console.log('Magic Word Search clicked - wordLists:', wordLists);
    if (wordLists.length > 0) {
      setShowProgress(true);
      setProgressMessage('Finding your active spell book...');

      // Get active lists
      const activeLists = wordLists.filter(list => {
        console.log('Checking list:', list.name, 'isActive:', list.isActive);
        return list.isActive === true;
      });
      console.log('Active lists found:', activeLists);

      if (activeLists.length === 0) {
        console.log('No active lists found');
        setShowProgress(false);
        alert('No active spell books found. Ask your parent to activate one!');
        return;
      }

      // Use the most recent active list
      const activeList = activeLists[activeLists.length - 1];
      console.log('Selected active list:', activeList);
      
      // Call handleGenerateAIList directly with the active list
      await handleGenerateAIList('wordsearch', activeList);
    } else {
      console.log('No word lists available');
      alert('No spelling lists available. Ask your parent to assign some!');
    }
  };

  const handleGenerateAIList = async (type: 'spelling' | 'wordsearch', activeList: WordList) => {
    console.log('handleGenerateAIList called with type:', type);
    console.log('activeList:', activeList);

    try {
      setProgressMessage(`Found spell book: ${activeList.name}`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgressMessage('Creating magical new words...');
      const words = activeList.words.map(w => w.word);
      console.log('Sending words to API:', words);
      
      try {
        const response = await fetch('/api/generate-words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ words }),
        });

        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate words');
        }

        if (!data.words || !Array.isArray(data.words)) {
          throw new Error('Invalid response format: missing words array');
        }

        setProgressMessage('Preparing your magical practice...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create a new list with the AI-generated words
        const aiList: WordList = {
          id: `ai_${Date.now()}`,  // Generate a temporary ID
          name: `${activeList.name} (AI ${type === 'spelling' ? 'Practice' : 'Word Search'})`,
          category: activeList.category,
          difficulty: activeList.difficulty,
          isActive: true,
          assignedTo: activeList.assignedTo,
          words: data.words.map((w: { word: string; hint: string }) => ({
            word: w.word.toLowerCase(),
            hint: w.hint
          }))
        };

        console.log('Created new AI list:', aiList);
        
        if (type === 'spelling') {
          // For spelling practice, set the list and show practice
          setSelectedList(aiList);
          setShowPractice(true);
        } else {
          // For word search, store the list in localStorage and navigate
          localStorage.setItem('currentWordSearchList', JSON.stringify(aiList));
          router.push('/child/word-search');
        }
        setShowAIOptions(false);
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        throw new Error(`Failed to generate words: ${apiError.message}`);
      }
    } catch (error: any) {
      console.error('Error in handleGenerateAIList:', error);
      alert(error.message || 'Failed to generate new words. Please try again.');
    } finally {
      setShowProgress(false);
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

  const PracticeOptionsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Choose Your Practice</h2>
          <button
            onClick={() => setShowAIOptions(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Regular Practice Options */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Regular Practice</h3>
            <button
              onClick={() => {
                setShowAIOptions(false);
                setShowWordLists(true);
              }}
              className="w-full p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Book className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">Spelling Practice</h3>
              </div>
              <p className="text-gray-600">Practice your assigned spelling lists</p>
            </button>

            <button
              onClick={() => {
                setShowAIOptions(false);
                router.push('/child/word-search');
              }}
              className="w-full p-6 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">Word Search</h3>
              </div>
              <p className="text-gray-600">Find words from your spelling lists</p>
            </button>
          </div>

          {/* AI Practice Options */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Magic Practice</h3>
            <button
              onClick={handleMagicSpelling}
              className="w-full p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Magic Spelling</h3>
              </div>
              <p className="text-gray-600">Practice with magically generated similar words</p>
            </button>

            <button
              onClick={handleMagicWordSearch}
              className="w-full p-6 bg-green-50 rounded-lg hover:bg-green-100 transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Magic Word Search</h3>
              </div>
              <p className="text-gray-600">Find magically generated similar words in a puzzle</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProgressDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-purple-800 mb-4">Magic in Progress...</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700">{progressMessage}</p>
        </div>
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
          <div 
            onClick={() => setShowAIOptions(true)}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
          >
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

        {showAIOptions && <PracticeOptionsModal />}

        {showWordLists && <WordListModal />}

        {showPractice && selectedList && (
          <SpellPractice
            child={child}
            onClose={() => setShowPractice(false)}
            onComplete={handlePracticeComplete}
            selectedList={selectedList}
          />
        )}

        {showTestHistory && child && (
          <TestHistoryDialog
            childId={child.id}
            onClose={() => setShowTestHistory(false)}
          />
        )}

        {showProgress && <ProgressDialog />}
      </div>
    </ChildDashboardLayout>
  );
} 