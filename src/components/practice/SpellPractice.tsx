'use client';

import { useState, useEffect } from 'react';
import { Loader2, Volume2, Check, X, Trophy, Star } from 'lucide-react';
import { WordList, Child, TestResult } from '@/types';
import { getDocuments, addDocument, updateDocument } from '@/lib/firebase/firebaseUtils';
import { motion } from 'framer-motion';
import type { CreateTypes } from 'canvas-confetti';

// Dynamic import for canvas-confetti to avoid SSR issues
let confetti: CreateTypes;
if (typeof window !== 'undefined') {
  import('canvas-confetti').then((module) => {
    confetti = module.default as CreateTypes;
  });
}

interface Props {
  child: Child;
  onClose: () => void;
  onComplete: (score: number) => void;
  selectedList?: WordList;
}

export default function SpellPractice({ child, onClose, onComplete, selectedList }: Props) {
  const [loading, setLoading] = useState(true);
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime] = useState(Date.now());
  const [wordsCorrect, setWordsCorrect] = useState<string[]>([]);
  const [wordsIncorrect, setWordsIncorrect] = useState<{ word: string; userInput: string }[]>([]);

  useEffect(() => {
    const fetchRecentList = async () => {
      try {
        const lists = await getDocuments('wordLists') as WordList[];
        console.log('SpellPractice - All word lists:', lists);
        
        // Filter for active lists assigned to this child
        const activeLists = lists.filter(list => 
          list.assignedTo?.includes(child.id) && 
          list.isActive
        );
        
        console.log('SpellPractice - Active lists for child:', activeLists);
        
        if (activeLists.length > 0) {
          // Get the most recent active list
          const mostRecent = activeLists[activeLists.length - 1];
          console.log('SpellPractice - Selected list:', mostRecent);
          setWordList(mostRecent);
        }
      } catch (error) {
        console.error('Error fetching word lists:', error);
      } finally {
        setLoading(false);
      }
    };

    // If we have a selected list from props, use that instead of fetching
    if (selectedList) {
      console.log('SpellPractice - Using provided list:', selectedList);
      setWordList(selectedList);
      setLoading(false);
    } else {
      fetchRecentList();
    }
  }, [child.id, selectedList]);

  useEffect(() => {
    // Function to initialize voices
    const initVoices = () => {
      const savedVoice = localStorage.getItem('selectedVoice');
      const voices = window.speechSynthesis.getVoices();
      
      if (savedVoice && voices.length > 0) {
        const voice = voices.find(v => v.voiceURI === savedVoice);
        setSelectedVoice(voice || null);
      } else {
        // Set default to Google UK English Male if available
        const defaultVoice = voices.find(v => v.name === 'Google UK English Male');
        if (defaultVoice) {
          setSelectedVoice(defaultVoice);
          localStorage.setItem('selectedVoice', defaultVoice.voiceURI);
        }
      }
    };

    // Wait for voices to be loaded
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) {
        initVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = initVoices;
      }
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWord = () => {
    if (!wordList || !currentWord || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    
    // Get voices again to ensure we have the latest list
    const voices = window.speechSynthesis.getVoices();
    const savedVoice = localStorage.getItem('selectedVoice');
    
    if (savedVoice) {
      const voice = voices.find(v => v.voiceURI === savedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set other properties
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordList || !currentWord) return;
    
    const isWordCorrect = userInput.toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(isWordCorrect);
    
    if (isWordCorrect) {
      setScore(prev => prev + 1);
      setWordsCorrect(prev => [...prev, currentWord.word]);
    } else {
      setWordsIncorrect(prev => [...prev, { word: currentWord.word, userInput }]);
    }

    setTimeout(() => {
      if (currentWordIndex < wordList.words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setUserInput('');
        setIsCorrect(null);
      } else {
        setShowSuccess(true);
        const percentage = (score + (isWordCorrect ? 1 : 0)) / wordList.words.length * 100;
        
        if (percentage >= 90) {
          triggerCelebration('excellent');
        } else if (percentage >= 70) {
          triggerCelebration('good');
        } else if (percentage >= 50) {
          triggerCelebration('pass');
        }
      }
    }, 1500);
  };

  const handleCompleteTest = async () => {
    if (!wordList || !child?.id) {
      console.error('Missing required data');
      onComplete?.(score);
      return;
    }

    const testResult: Omit<TestResult, 'id'> = {
      type: 'spelling',
      date: new Date().toISOString(),
      childId: child.id,
      listId: wordList.id,
      listName: wordList.name,
      score,
      total: wordList.words.length,
      percentage: Math.round((score / wordList.words.length) * 100),
      timeTaken: Date.now() - startTime,
      wordsCorrect,
      wordsIncorrect,
      difficulty: wordList.difficulty
    };

    try {
      // Save to Firebase
      const resultRef = await addDocument('testResults', testResult);
      
      // Get current child data
      const currentChild = JSON.parse(localStorage.getItem('childUser') || '{}');
      
      // Update child's test history
      const updatedHistory = [...(currentChild.testHistory || []), { ...testResult, id: resultRef.id }];
      
      // Update Firebase
      await updateDocument('children', child.id, {
        testHistory: updatedHistory,
        'progress.completedQuests': (child.progress?.completedQuests || 0) + 1,
        'progress.accuracy': Math.round(
          ((child.progress.accuracy * child.progress.completedQuests) + (score * 100 / wordList.words.length)) / 
          (child.progress.completedQuests + 1)
        )
      });

      // Update local storage
      const updatedChild = {
        ...currentChild,
        testHistory: updatedHistory,
        progress: {
          ...currentChild.progress,
          completedQuests: (currentChild.progress?.completedQuests || 0) + 1,
          accuracy: Math.round(
            ((currentChild.progress.accuracy * currentChild.progress.completedQuests) + (score * 100 / wordList.words.length)) / 
            (currentChild.progress.completedQuests + 1)
          )
        }
      };
      localStorage.setItem('childUser', JSON.stringify(updatedChild));

      onComplete?.(score);
    } catch (error) {
      console.error('Error saving test results:', error);
      onComplete?.(score);
    }
  };

  const triggerCelebration = (level: 'pass' | 'good' | 'excellent') => {
    if (!confetti) return;

    switch (level) {
      case 'excellent':
        // Gold confetti burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        });
        break;
      case 'good':
        // Silver confetti
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#C0C0C0', '#A9A9A9']
        });
        break;
      case 'pass':
        // Simple celebration
        confetti({
          particleCount: 30,
          spread: 30,
          origin: { y: 0.6 }
        });
        break;
    }
  };

  const currentWord = wordList?.words[currentWordIndex];

  const SuccessScreen = () => {
    const percentage = (score / (wordList?.words.length || 1)) * 100;
    const minutes = Math.floor((Date.now() - startTime) / 60000);
    const seconds = Math.floor(((Date.now() - startTime) % 60000) / 1000);

    return (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-purple-800"
        >
          Spell Quest Complete!
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-lg text-gray-700">
              Score: {score} out of {wordList?.words.length} ({percentage.toFixed(1)}%)
            </p>
            <p className="text-sm text-gray-600">
              Time taken: {minutes}m {seconds}s
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Correct Words</h3>
              <p className="text-sm text-green-600">{wordsCorrect.length} words</p>
              <div className="mt-2 text-xs text-green-700 max-h-32 overflow-y-auto">
                {wordsCorrect.map(word => (
                  <div key={word} className="py-1">{word}</div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Needs Practice</h3>
              <p className="text-sm text-red-600">{wordsIncorrect.length} words</p>
              <div className="mt-2 text-xs text-red-700 max-h-32 overflow-y-auto">
                {wordsIncorrect.map(({ word, userInput }) => (
                  <div key={word} className="py-1">
                    {word} (typed: {userInput})
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {percentage >= 90 && (
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
              </motion.div>
            )}
            {percentage >= 70 && percentage < 90 && (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
              </motion.div>
            )}
            {percentage >= 50 && percentage < 70 && (
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleCompleteTest}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Continue Adventure
        </motion.button>
      </motion.div>
    );
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <SuccessScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">
            {wordList ? `${wordList.name} - Word ${currentWordIndex + 1} of ${wordList.words.length}` : 'Spelling Practice'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading spell book...</p>
          </div>
        ) : !wordList ? (
          <p className="text-center text-gray-600 py-8">No active spell books available. Ask your parent to assign one!</p>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentWordIndex / wordList.words.length) * 100}%` }}
              />
            </div>

            {/* Score */}
            <div className="text-center">
              <p className="text-lg font-semibold text-purple-800">
                Score: {score}/{wordList.words.length}
              </p>
            </div>

            {/* Word Section */}
            <div className="text-center space-y-4">
              <button
                onClick={speakWord}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition"
              >
                <Volume2 className="w-5 h-5" />
                Hear Word
              </button>

              {currentWord?.hint && (
                <p className="text-gray-600 italic">Hint: {currentWord.hint}</p>
              )}
            </div>

            {/* Input Section */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={`w-full px-4 py-2 border-2 rounded-md text-center text-xl text-gray-900 ${
                  isCorrect === null
                    ? 'border-gray-200 bg-white'
                    : isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
                placeholder="Type the word here..."
                autoFocus
                disabled={isCorrect !== null}
              />

              {isCorrect !== null && currentWord && (
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <p className="text-green-500">Correct!</p>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-500" />
                      <p className="text-red-500">
                        The correct spelling is: {currentWord.word}
                      </p>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!userInput || isCorrect !== null}
                className="w-full px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
              >
                Check Spelling
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 