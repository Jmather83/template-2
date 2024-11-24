const adjectives = [
  'Mystic', 'Arcane', 'Celestial', 'Astral', 'Ethereal', 
  'Crystal', 'Starlit', 'Ancient', 'Enchanted', 'Magical',
  'Radiant', 'Spectral', 'Luminous', 'Cosmic', 'Whimsical'
];

const nouns = [
  'Sage', 'Wizard', 'Sorcerer', 'Mage', 'Spellweaver',
  'Scholar', 'Wandkeeper', 'Enchanter', 'Magician', 'Conjurer',
  'Alchemist', 'Warlock', 'Mystic', 'Summoner', 'Spellcaster'
];

export const generateWizardName = async (existingNames: string[] = []): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const wizardName = `${adjective}${noun}${number}`;
    
    if (!existingNames.includes(wizardName)) {
      return wizardName;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique wizard name');
}; 