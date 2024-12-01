import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WordList } from '@/types';
import { addDocument, updateDocument } from '@/lib/firebase/firebaseUtils';

interface Props {
  childId: string;
  onClose: () => void;
  wordList: WordList;
}

interface Solution {
  word: string;
  start: [number, number];
  end: [number, number];
}

const generateGrid = (words: string[]) => {
  const size = 15; // Fixed grid size
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  const solutions: Solution[] = [];
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
  ];

  // Helper to check if a word fits at a position
  const wordFits = (word: string, row: number, col: number, dRow: number, dCol: number): boolean => {
    if (
      row + dRow * (word.length - 1) < 0 ||
      row + dRow * (word.length - 1) >= size ||
      col + dCol * (word.length - 1) < 0 ||
      col + dCol * (word.length - 1) >= size
    ) {
      return false;
    }

    for (let i = 0; i < word.length; i++) {
      const currentRow = row + dRow * i;
      const currentCol = col + dCol * i;
      const currentCell = grid[currentRow][currentCol];
      if (currentCell !== '' && currentCell !== word[i]) {
        return false;
      }
    }
    return true;
  };

  // Place each word
  const processedWords = words.map(word => word.toUpperCase().replace(/[^A-Z-]/g, ''));
  for (const word of processedWords) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (wordFits(word, row, col, direction[0], direction[1])) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          const currentRow = row + direction[0] * i;
          const currentCol = col + direction[1] * i;
          grid[currentRow][currentCol] = word[i];
        }

        solutions.push({
          word,
          start: [row, col],
          end: [row + direction[0] * (word.length - 1), col + direction[1] * (word.length - 1)]
        });
        placed = true;
      }
      attempts++;
    }
  }

  // Fill empty cells with random letters
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, solutions };
};

export default function WordSearch({ childId, onClose, wordList }: Props) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [currentSelection, setCurrentSelection] = useState<[number, number] | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const words = wordList.words.map(w => w.word);
    const { grid, solutions } = generateGrid(words);
    setGrid(grid);
    setSolutions(solutions);
  }, [wordList]);

  const getSelectedCells = () => {
    if (!selectionStart || !currentSelection) return new Set<string>();

    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;

    // Calculate direction
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    // Only allow horizontal, vertical, or diagonal
    if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
      return new Set<string>();
    }

    const cells = new Set<string>();
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    const rowStep = steps === 0 ? 0 : rowDiff / steps;
    const colStep = steps === 0 ? 0 : colDiff / steps;

    for (let i = 0; i <= steps; i++) {
      const row = Math.round(startRow + (rowStep * i));
      const col = Math.round(startCol + (colStep * i));
      cells.add(`${row}-${col}`);
    }

    return cells;
  };

  const handleCellMouseDown = (row: number, col: number) => {
    setSelectionStart([row, col]);
    setCurrentSelection([row, col]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!selectionStart) return;

    const [startRow, startCol] = selectionStart;
    const rowDiff = Math.abs(row - startRow);
    const colDiff = Math.abs(col - startCol);

    // Only update if moving in a valid direction
    if (
      row === startRow || // horizontal
      col === startCol || // vertical
      rowDiff === colDiff // diagonal
    ) {
      setCurrentSelection([row, col]);
    }
  };

  const handleCellMouseUp = () => {
    if (!selectionStart || !currentSelection) return;

    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;

    // Check if this selection matches any solution
    const found = solutions.find(solution => {
      const [solStartRow, solStartCol] = solution.start;
      const [solEndRow, solEndCol] = solution.end;

      // Check both forward and reverse directions
      return (
        (startRow === solStartRow && startCol === solStartCol && endRow === solEndRow && endCol === solEndCol) ||
        (startRow === solEndRow && startCol === solEndCol && endRow === solStartRow && endCol === solStartCol)
      );
    });

    if (found && !foundWords.includes(found.word)) {
      setFoundWords(prev => [...prev, found.word]);
    }

    setSelectionStart(null);
    setCurrentSelection(null);
  };

  const handleFinish = async () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate words not found
    const wordsNotFound = solutions
      .map(s => s.word)
      .filter(word => !foundWords.includes(word));

    // Create test result
    const testResult = {
      type: 'wordsearch' as const,
      date: new Date().toISOString(),
      childId,
      listId: wordList.id,
      listName: wordList.name,
      score: foundWords.length,
      total: solutions.length,
      percentage: Math.round((foundWords.length / solutions.length) * 100),
      timeTaken: duration,
      wordsFound: foundWords,
      wordsNotFound,
      difficulty: wordList.difficulty
    };

    try {
      // Save to Firebase
      const resultRef = await addDocument('testResults', testResult);
      
      // Get current child data
      const childData = localStorage.getItem('childUser');
      if (!childData) return;
      
      const currentChild = JSON.parse(childData);
      
      // Update child's test history
      const updatedHistory = [
        ...(currentChild.testHistory || []),
        { ...testResult, id: resultRef.id }
      ];
      
      // Update Firebase and local storage
      await updateDocument('children', childId, {
        testHistory: updatedHistory,
        'progress.wordsearchesCompleted': (currentChild.progress?.wordsearchesCompleted || 0) + 1,
        'progress.totalTests': (currentChild.progress?.totalTests || 0) + 1
      });

      // Update local storage
      localStorage.setItem('childUser', JSON.stringify({
        ...currentChild,
        testHistory: updatedHistory,
        progress: {
          ...currentChild.progress,
          wordsearchesCompleted: (currentChild.progress?.wordsearchesCompleted || 0) + 1,
          totalTests: (currentChild.progress?.totalTests || 0) + 1
        }
      }));

      onClose();
    } catch (error) {
      console.error('Error saving word search results:', error);
    }
  };

  if (grid.length === 0) return null;

  const selectedCells = getSelectedCells();

  return (
    <div className="bg-white rounded-lg p-8 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-800">
          {wordList.name}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <div 
            className="inline-grid gap-1 bg-gray-100 p-2 rounded-lg"
            style={{ 
              gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
              userSelect: 'none'
            }}
            onMouseLeave={() => {
              setSelectionStart(null);
              setCurrentSelection(null);
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCells.has(`${rowIndex}-${colIndex}`);
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-12 h-12
                      flex items-center justify-center 
                      font-bold text-xl text-gray-800
                      ${isSelected ? 'bg-green-300' : 'bg-white hover:bg-purple-50'} 
                      cursor-pointer select-none 
                      rounded
                      transition-colors duration-100
                      text-center leading-10
                    `}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                    onMouseUp={handleCellMouseUp}
                  >
                    {cell}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Words to Find:</h3>
          <div className="grid grid-cols-2 gap-4">
            {wordList.words.map(({ word }) => {
              const processedWord = word.toUpperCase().replace(/[^A-Z-]/g, '');
              return (
                <div
                  key={word}
                  className={`px-3 py-1 rounded ${
                    foundWords.includes(processedWord)
                      ? 'bg-green-300 text-gray-800 line-through'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {word}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="text-gray-600">
              Found {foundWords.length} of {solutions.length} words
            </div>
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Finish Word Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 