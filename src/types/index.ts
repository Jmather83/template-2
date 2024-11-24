export interface Parent {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Child {
  id: string;
  parentId: string;
  username: string;
  realName: string;
  displayName: string;
  pin: string;
  age: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  avatarConfig?: CharacterCustomization;
  progress: {
    coins: number;
    gems: number;
    completedQuests: number;
    accuracy: number;
  };
}

export interface WordList {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  words: Array<{
    word: string;
    hint?: string;
  }>;
  assignedTo: string[]; // Child IDs
}

export interface CharacterCustomization {
  gender: 'male' | 'female' | 'other';
  skinTone: string;
  region: string;
  hair: {
    style: string;
    colour: string;
  };
  facialFeatures: {
    eyes: string;
    nose: string;
    mouth: string;
  };
  equipment: {
    wand: {
      style: string;
      isUnlocked: boolean;
    };
    book: {
      style: string;
      isUnlocked: boolean;
    };
    mount: {
      style: string;
      isUnlocked: boolean;
    };
  };
  outfit: {
    style: string;
    colour: string;
    isUnlocked: boolean;
  };
  accessories: {
    type: string;
    style: string;
    isUnlocked: boolean;
  }[];
  selectedEquipment: 'wand' | 'book' | 'mount';
}

export interface UISettings {
  colourScheme: 'light' | 'dark' | 'system';
  behaviour: {
    autoSave: boolean;
    notifications: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

export interface LearningPreferences {
  practiseReminders: boolean;
  favouriteSubjects: string[];
  programme: {
    difficulty: string;
    learningStyle: string;
  };
} 