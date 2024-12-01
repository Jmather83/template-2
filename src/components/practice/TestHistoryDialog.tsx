import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TestResult } from '@/types';
import { getDocuments } from '@/lib/firebase/firebaseUtils';

interface Props {
  childId: string;
  onClose: () => void;
}

export default function TestHistoryDialog({ childId, onClose }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'spelling' | 'wordsearch'>('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const allResults = await getDocuments('testResults') as TestResult[];
        const childResults = allResults
          .filter(result => result.childId === childId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setResults(childResults);
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [childId]);

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

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.type === filter;
  });

  const renderResultDetails = (result: TestResult) => {
    return (
      <tr key={result.id} className="hover:bg-purple-50">
        <td className="px-4 py-3 text-gray-800">{formatDate(result.date)}</td>
        <td className="px-4 py-3 text-gray-800">
          {result.listName}
          <span className="ml-2 text-xs text-gray-500 capitalize">
            ({result.type})
          </span>
        </td>
        <td className="px-4 py-3 text-center text-gray-800">
          {result.score}/{result.total}
        </td>
        <td className="px-4 py-3 text-center text-gray-800">
          {result.percentage}%
        </td>
        <td className="px-4 py-3 text-center text-gray-800">
          {formatTime(result.timeTaken)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {result.type === 'spelling' && result.wordsIncorrect && result.wordsIncorrect.length > 0 && (
            <div>
              Missed: {result.wordsIncorrect.map(w => w.word).join(', ')}
            </div>
          )}
          {result.type === 'wordsearch' && result.wordsNotFound && result.wordsNotFound.length > 0 && (
            <div>
              Not found: {result.wordsNotFound.join(', ')}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Test History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tests ({results.length})
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
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading test history...</p>
        ) : filteredResults.length === 0 ? (
          <p className="text-center text-gray-600">No completed tests yet!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-4 py-2 text-left text-purple-800">Date</th>
                  <th className="px-4 py-2 text-left text-purple-800">Activity</th>
                  <th className="px-4 py-2 text-center text-purple-800">Score</th>
                  <th className="px-4 py-2 text-center text-purple-800">Accuracy</th>
                  <th className="px-4 py-2 text-center text-purple-800">Time</th>
                  <th className="px-4 py-2 text-left text-purple-800">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {filteredResults.map(renderResultDetails)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 