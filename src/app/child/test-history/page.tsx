'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Child, TestResult } from '@/types';
import { getDocuments } from '@/lib/firebase/firebaseUtils';
import ChildDashboardLayout from '@/components/layouts/ChildDashboardLayout';
import DatePicker from 'react-datepicker';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

const RESULTS_PER_PAGE = 10;

export default function TestHistory() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'spelling' | 'wordsearch'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const childData = localStorage.getItem('childUser');
    if (!childData) {
      router.push('/child/login');
      return;
    }
    const parsedChild = JSON.parse(childData);
    setChild(parsedChild);

    const fetchResults = async () => {
      try {
        const allResults = await getDocuments('testResults') as TestResult[];
        const childResults = allResults
          .filter(result => result.childId === parsedChild.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setResults(childResults);
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

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
  }, [filter, startDate, endDate]);

  // Fix DatePicker type issues
  const startDateValue = startDate || undefined;
  const endDateValue = endDate || undefined;

  if (!child) return null;

  return (
    <ChildDashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">Your Test History</h1>
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
            <h2 className="text-xl font-bold text-purple-800 mb-4">Test Results</h2>
            {loading ? (
              <p className="text-gray-600">Loading results...</p>
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

                {/* Pagination with improved visibility */}
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
                              {word} (you wrote: {userInput})
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
    </ChildDashboardLayout>
  );
} 