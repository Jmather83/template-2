import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WordList } from '@/types';
import { getDocuments, addDocument, updateDocument } from '@/lib/firebase/firebaseUtils';

interface Props {
  childId: string;
  onClose: () => void;
}

const generateGrid = (words: string[]) => {
  // Calculate grid size based on longest word and total words
  const longestWord = Math.max(...words.map(w => w.length));
  const minSize = Math.max(longestWord, Math.ceil(Math.sqrt(words.reduce((acc, word) => acc + word.length, 0))));
  const size = Math.max(minSize, 10); // Minimum 10x10 grid

  // Initialize grid with empty spaces
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const placed = new Set<string>();
  const solutions: { word: string; start: [number, number]; end: [number, number] }[] = [];

  // Directions: horizontal, vertical, diagonal
  const directions = [
    [0, 1],   // right
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
  ];

  const processWord = (word: string) => {
    // Split the word by hyphens, capitalize each part, then rejoin with hyphens
    return word.split('-').map(part => part.toUpperCase()).join('-');
  };

  const canPlaceWord = (word: string, row: number, col: number, dRow: number, dCol: number) => {
    if (row + dRow * (word.length - 1) >= size || row + dRow * (word.length - 1) < 0) return false;
    if (col + dCol * (word.length - 1) >= size) return false;

    for (let i = 0; i < word.length; i++) {
      const currentRow = row + dRow * i;
      const currentCol = col + dCol * i;
      const currentCell = grid[currentRow][currentCol];
      if (currentCell !== '' && currentCell !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (word: string) => {
    // Process the word to capitalize all letters while keeping hyphens
    const processedWord = processWord(word);
    
    const attempts = 100;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (canPlaceWord(processedWord, row, col, direction[0], direction[1])) {
        for (let i = 0; i < processedWord.length; i++) {
          const currentRow = row + direction[0] * i;
          const currentCol = col + direction[1] * i;
          grid[currentRow][currentCol] = processedWord[i];
        }
        placed.add(processedWord);
        solutions.push({
          word: processedWord,
          start: [row, col],
          end: [row + direction[0] * (processedWord.length - 1), col + direction[1] * (processedWord.length - 1)]
        });
        return true;
      }
    }
    return false;
  };

  // Try to place each word
  words.forEach(word => {
    placeWord(word);
  });

  // Fill remaining spaces with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, solutions, placed: Array.from(placed) };
};

export default function WordSearch({ childId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [puzzle, setPuzzle] = useState<{
    grid: string[][];
    solutions: { word: string; start: [number, number]; end: [number, number] }[];
    placed: string[];
  } | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [currentSelection, setCurrentSelection] = useState<[number, number] | null>(null);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    const fetchRecentList = async () => {
      try {
        const lists = await getDocuments('wordLists') as WordList[];
        console.log('WordSearch - All word lists:', lists);
        const childLists = lists.filter(list => list.assignedTo?.includes(childId));
        console.log('WordSearch - Child word lists:', childLists, 'Child ID:', childId);
        if (childLists.length > 0) {
          const mostRecent = childLists[childLists.length - 1];
          console.log('WordSearch - Selected list:', mostRecent);
          setWordList(mostRecent);
          const wordStrings = mostRecent.words.map(w => w.word);
          console.log('WordSearch - Words for puzzle:', wordStrings);
          const newPuzzle = generateGrid(wordStrings);
          setPuzzle(newPuzzle);
        } else {
          console.log('WordSearch - No word lists found for child:', childId);
        }
      } catch (error) {
        console.error('WordSearch - Error fetching word lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentList();
  }, [childId]);

  const handleCellMouseDown = (row: number, col: number) => {
    setSelectionStart([row, col]);
    setCurrentSelection([row, col]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (selectionStart) {
      setCurrentSelection([row, col]);
    }
  };

  const handleCellMouseUp = () => {
    if (!selectionStart || !currentSelection || !puzzle) return;

    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;

    // Check if this selection matches any solution
    const found = puzzle.solutions.find(solution => {
      const [solStartRow, solStartCol] = solution.start;
      const [solEndRow, solEndCol] = solution.end;
      return (
        (startRow === solStartRow && startCol === solStartCol && endRow === solEndRow && endCol === solEndCol) ||
        (startRow === solEndRow && startCol === solEndCol && endRow === solStartRow && endCol === solStartCol)
      );
    });

    if (found) {
      setFoundWords(prev => new Set(Array.from(prev).concat([found.word])));
    }

    setSelectionStart(null);
    setCurrentSelection(null);
  };

  const getSelectionDirection = () => {
    if (!selectionStart || !currentSelection) return null;
    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;
    
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;
    
    // Must move at least one cell
    if (rowDiff === 0 && colDiff === 0) return null;
    
    // Only allow horizontal or diagonal movement
    if (rowDiff === 0) return [0, 1]; // horizontal
    if (Math.abs(rowDiff) === Math.abs(colDiff)) return [1, 1]; // diagonal
    return null;
  };

  const getSelectedCells = () => {
    if (!selectionStart || !currentSelection) return new Set<string>();
    
    const direction = getSelectionDirection();
    if (!direction) return new Set<string>();
    
    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;
    const cells = new Set<string>();
    
    // Calculate how many steps to take
    const steps = Math.max(
      Math.abs(endRow - startRow),
      Math.abs(endCol - startCol)
    );
    
    // Determine actual direction based on start and end points
    const actualRowDir = startRow === endRow ? 0 : Math.sign(endRow - startRow);
    const actualColDir = startCol === endCol ? 0 : Math.sign(endCol - startCol);
    
    // Add all cells along the path
    for (let i = 0; i <= steps; i++) {
      const row = startRow + actualRowDir * i;
      const col = startCol + actualColDir * i;
      cells.add(`${row}-${col}`);
    }
    
    return cells;
  };

  const getSelectionPath = () => {
    if (!selectionStart || !currentSelection) return '';
    
    const direction = getSelectionDirection();
    if (!direction) return '';
    
    const [startRow, startCol] = selectionStart;
    const [endRow, endCol] = currentSelection;
    
    // Calculate cell size and positions
    const cellSize = 28;
    const padding = 8; // 2rem (p-2) = 8px
    
    // Calculate start and end points (center of cells)
    const startX = padding + (startCol * cellSize) + (cellSize / 2);
    const startY = padding + (startRow * cellSize) + (cellSize / 2);
    const endX = padding + (endCol * cellSize) + (cellSize / 2);
    const endY = padding + (endRow * cellSize) + (cellSize / 2);
    
    // Calculate the selection box dimensions
    const width = cellSize * 0.8; // Increased width for better visibility
    
    // Calculate angle of the line
    const angle = Math.atan2(endY - startY, endX - startX);
    
    // Calculate perpendicular points for the selection box
    const perpAngle = angle + Math.PI / 2;
    const halfWidth = width / 2;
    
    // Calculate the four corners of the selection box
    const p1x = startX + Math.cos(perpAngle) * halfWidth;
    const p1y = startY + Math.sin(perpAngle) * halfWidth;
    const p2x = endX + Math.cos(perpAngle) * halfWidth;
    const p2y = endY + Math.sin(perpAngle) * halfWidth;
    const p3x = endX - Math.cos(perpAngle) * halfWidth;
    const p3y = endY - Math.sin(perpAngle) * halfWidth;
    const p4x = startX - Math.cos(perpAngle) * halfWidth;
    const p4y = startY - Math.sin(perpAngle) * halfWidth;
    
    // Create path with rounded corners
    const radius = 4;
    return `
      M ${p1x} ${p1y}
      L ${p2x} ${p2y}
      A ${radius} ${radius} 0 0 1 ${p3x} ${p3y}
      L ${p4x} ${p4y}
      A ${radius} ${radius} 0 0 1 ${p1x} ${p1y}
      Z
    `.trim();
  };

  const handleFinish = async () => {
    if (!wordList || !puzzle) return;

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Calculate words not found
    const wordsNotFound = puzzle.placed.filter(word => !foundWords.has(word));

    // Create test result
    const testResult = {
      type: 'wordsearch' as const,
      date: new Date().toISOString(),
      childId,
      listId: wordList.id,
      listName: wordList.name,
      score: foundWords.size,
      total: puzzle.placed.length,
      percentage: Math.round((foundWords.size / puzzle.placed.length) * 100),
      timeTaken: duration,
      wordsFound: Array.from(foundWords),
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <p className="text-center text-gray-600">Loading word search...</p>
        </div>
      </div>
    );
  }

  if (!wordList || !puzzle) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <p className="text-center text-gray-600">No word list available for word search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Magical Word Search</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Word Search Grid */}
          <div className="flex-1">
            <div className="relative">
              <div 
                className="inline-grid bg-gray-200 p-2 rounded-lg"
                style={{ 
                  gridTemplateColumns: `repeat(${puzzle.grid[0].length}, 28px)`,
                  gap: 0,
                  userSelect: 'none'
                }}
                onMouseLeave={() => {
                  setSelectionStart(null);
                  setCurrentSelection(null);
                }}
              >
                {puzzle.grid.map((row, rowIndex) => (
                  row.map((letter, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const selectedCells = getSelectedCells();
                    const isSelected = selectedCells.has(cellKey);
                    const isEndpoint = 
                      (selectionStart && rowIndex === selectionStart[0] && colIndex === selectionStart[1]) ||
                      (currentSelection && rowIndex === currentSelection[0] && colIndex === currentSelection[1]);

                    return (
                      <div
                        key={cellKey}
                        className={`
                          w-7 h-7 flex items-center justify-center font-bold
                          ${letter === '-' ? 'text-red-500' : 'text-gray-700'}
                          ${isSelected ? 'bg-purple-100' : 'bg-white'}
                          ${isEndpoint ? 'bg-purple-200' : ''}
                          cursor-pointer hover:bg-purple-50 transition-colors
                          select-none
                        `}
                        style={{
                          width: '28px',
                          height: '28px',
                          lineHeight: '28px'
                        }}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onMouseUp={handleCellMouseUp}
                      >
                        {letter}
                      </div>
                    );
                  })
                ))}
              </div>
              
              {/* Selection Overlay */}
              <svg 
                className="absolute inset-0 pointer-events-none" 
                style={{ width: '100%', height: '100%' }}
              >
                <path
                  d={getSelectionPath()}
                  fill="rgba(255, 0, 0, 0.1)"
                  stroke="red"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-100"
                />
              </svg>
            </div>
          </div>

          {/* Word List */}
          <div className="w-48">
            <h3 className="text-lg font-semibold mb-2 text-purple-800">Find these words:</h3>
            <div className="space-y-2">
              {puzzle.placed.map(word => (
                <div
                  key={word}
                  className={`px-3 py-1 rounded ${
                    foundWords.has(word)
                      ? 'bg-green-100 text-green-800 line-through'
                      : 'bg-purple-50 text-gray-700'
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Finish Button */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-gray-600">
            Found {foundWords.size} of {puzzle.placed.length} words
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
  );
} 