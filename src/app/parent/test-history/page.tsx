'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Child, TestResult } from '@/types';
import { getDocuments, deleteDocument, updateDocument } from '@/lib/firebase/firebaseUtils';
import ParentDashboardLayout from '@/components/layouts/ParentDashboardLayout';
import DatePicker from 'react-datepicker';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

const RESULTS_PER_PAGE = 10;

export default function ParentTestHistory() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'spelling' | 'wordsearch'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childrenData, allResults] = await Promise.all([
          getDocuments('children') as Promise<Child[]>,
          getDocuments('testResults') as Promise<TestResult[]>
        ]);

        const userChildren = childrenData.filter(child => child.parentId === user?.uid);
        setChildren(userChildren);
        
        if (userChildren.length > 0) {
          setSelectedChild(userChildren[0]);
          const childResults = allResults
            .filter(result => result.childId === userChildren[0].id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          console.log('Initial child results:', childResults);
          setResults(childResults);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedChild) return;
      
      try {
        const allResults = await getDocuments('testResults') as TestResult[];
        const childResults = allResults
          .filter(result => result.childId === selectedChild.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setResults(childResults);
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };

    fetchResults();
  }, [selectedChild]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Fix DatePicker type issues
  const startDateValue = startDate || undefined;
  const endDateValue = endDate || undefined;

  // Filter results by type and date
  const filteredResults = results.filter(result => {
    if (filter !== 'all' && result.type !== filter) return false;
    if (startDate && new Date(result.date) < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(result.date) > endOfDay) return false;
    }
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, startDate, endDate, selectedChild]);

  const handleClearHistory = async () => {
    if (!selectedChild) return;
    
    const confirmMessage = `Are you sure you want to clear all test and word search history for ${selectedChild.realName}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      // Get all test results for the selected child
      const allResults = await getDocuments('testResults') as TestResult[];
      const childResults = allResults.filter(result => result.childId === selectedChild.id);

      // Get all word search results for the selected child
      const allWordSearchResults = await getDocuments('wordSearchResults') as any[];
      const childWordSearchResults = allWordSearchResults.filter(result => result.childId === selectedChild.id);

      // Delete each test result and word search result
      await Promise.all([
        ...childResults.map(result => deleteDocument('testResults', result.id)),
        ...childWordSearchResults.map(result => deleteDocument('wordSearchResults', result.id))
      ]);

      // Update child's test history in Firebase
      await updateDocument('children', selectedChild.id, {
        testHistory: [],
        wordSearchHistory: []
      });

      // Update local state
      setResults([]);
      setSelectedResult(null);

      // Show success message
      alert(`All history cleared for ${selectedChild.realName}`);
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history. Please try again.');
    }
  };

  return (
    <ParentDashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-purple-800">Test History</h1>
            {selectedChild && results.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all test history"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            )}
          </div>
          
          {/* Improved Child Selection Dropdown */}
          <div className="relative z-50">
            <button
              onClick={() => setShowChildDropdown(!showChildDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg border border-purple-200 hover:bg-purple-200 transition-colors"
            >
              <span className="text-purple-800 font-medium">
                {selectedChild ? selectedChild.realName : 'Select Child'}
              </span>
              <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${showChildDropdown ? 'transform rotate-180' : ''}`} />
            </button>
            
            {showChildDropdown && (
              <>
                {/* Backdrop to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowChildDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-purple-100 z-50">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChild(child);
                        setShowChildDropdown(false);
                        setSelectedResult(null);
                        // Immediately fetch results for the selected child
                        const fetchChildResults = async () => {
                          try {
                            const allResults = await getDocuments('testResults') as TestResult[];
                            const childResults = allResults
                              .filter(result => result.childId === child.id)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            console.log('Selected child results:', childResults);
                            setResults(childResults);
                          } catch (error) {
                            console.error('Error fetching results for child:', error);
                          }
                        };
                        fetchChildResults();
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors
                        ${selectedChild?.id === child.id ? 'bg-purple-100 text-purple-800' : 'text-gray-700'}
                        first:rounded-t-lg last:rounded-b-lg`}
                    >
                      {child.realName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Calendar className="w-5 h-5 text-purple-600" />
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDateValue}
              endDate={endDateValue}
              placeholderText="Start Date"
              className="px-4 py-2 border rounded-md"
              maxDate={new Date()}
            />
            <span>to</span>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDateValue}
              endDate={endDateValue}
              minDate={startDateValue}
              maxDate={new Date()}
              placeholderText="End Date"
              className="px-4 py-2 border rounded-md"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tests ({filteredResults.length})
          </button>
          <button
            onClick={() => setFilter('spelling')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'spelling'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Spelling Tests ({results.filter(r => r.type === 'spelling').length})
          </button>
          <button
            onClick={() => setFilter('wordsearch')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'wordsearch'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Word Searches ({results.filter(r => r.type === 'wordsearch').length})
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Results List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-4">
              Test Results
              {selectedChild && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  for {selectedChild.realName}
                </span>
              )}
            </h2>
            {loading ? (
              <p className="text-gray-600">Loading results...</p>
            ) : !selectedChild ? (
              <p className="text-gray-600">Please select a child to view their test results.</p>
            ) : results.length === 0 ? (
              <p className="text-gray-600">No test results found for {selectedChild.realName}.</p>
            ) : paginatedResults.length === 0 ? (
              <p className="text-gray-600">No test results found for the selected filters.</p>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {paginatedResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedResult?.id === result.id
                          ? 'bg-purple-100'
                          : 'bg-gray-50 hover:bg-purple-50'
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{result.listName}</h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(result.date)} · {formatTime(result.timeTaken)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-800">
                            {result.score}/{result.total}
                          </p>
                          <p className="text-sm text-gray-600">{result.percentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-4 border-t">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:hover:bg-transparent"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:hover:bg-transparent"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Result Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-4">Test Details</h2>
            {selectedResult ? (
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {selectedResult.listName}
                    <span className="ml-2 text-sm text-gray-500 capitalize">
                      ({selectedResult.type})
                    </span>
                  </h3>
                  <p className="text-gray-600">
                    Completed on {formatDate(selectedResult.date)}
                  </p>
                  <p className="text-gray-600">
                    Time taken: {formatTime(selectedResult.timeTaken)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Score</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {selectedResult.score}/{selectedResult.total}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Accuracy</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {selectedResult.percentage}%
                    </p>
                  </div>
                </div>

                {selectedResult.type === 'spelling' && (
                  <div className="space-y-4">
                    {selectedResult.wordsCorrect && selectedResult.wordsCorrect.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Correct Words</h4>
                        <div className="text-sm text-green-700 max-h-32 overflow-y-auto">
                          {selectedResult.wordsCorrect.map(word => (
                            <div key={word} className="py-1">{word}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResult.wordsIncorrect && selectedResult.wordsIncorrect.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Words to Practice</h4>
                        <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                          {selectedResult.wordsIncorrect.map(({ word, userInput }) => (
                            <div key={word} className="py-1">
                              {word} (wrote: {userInput})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedResult.type === 'wordsearch' && (
                  <div className="space-y-4">
                    {selectedResult.wordsFound && selectedResult.wordsFound.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Found Words</h4>
                        <div className="text-sm text-green-700 max-h-32 overflow-y-auto">
                          {selectedResult.wordsFound.map(word => (
                            <div key={word} className="py-1">{word}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResult.wordsNotFound && selectedResult.wordsNotFound.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Words Not Found</h4>
                        <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                          {selectedResult.wordsNotFound.map(word => (
                            <div key={word} className="py-1">{word}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Select a test to view details</p>
            )}
          </div>
        </div>
      </div>
    </ParentDashboardLayout>
  );
} 