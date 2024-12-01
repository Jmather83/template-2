export const britishDictionary = {
  // Common British spellings that differ from American English
  spellings: {
    'colour': true,
    'centre': true,
    'theatre': true,
    'catalogue': true,
    'defence': true,
    'licence': true,
    'practise': true, // verb form
    'practice': true, // noun form
    // ... add more
  },
  
  // Common British phrases and terms
  phrases: {
    'have a go': 'try',
    'sorted': 'organized',
    'brilliant': 'excellent',
    'cheers': 'thanks',
    // ... add more
  },
  
  // Educational terms in British English
  educationalTerms: {
    'maths': 'mathematics',
    'revision': 'study',
    'marks': 'grades',
    'timetable': 'schedule',
    // ... add more
  }
};

export const checkBritishSpelling = (word: string): boolean => {
  return !!britishDictionary.spellings[word.toLowerCase()];
};

export const getBritishAlternative = (word: string): string | null => {
  // Check if there's a British alternative for this word
  const lowerWord = word.toLowerCase();
  for (const [british, american] of Object.entries(britishSpellings)) {
    if (american.toLowerCase() === lowerWord) {
      return british;
    }
  }
  return null;
}; 