'use client';

import { useState } from 'react';
import { Child, CharacterCustomization } from '@/types';
import { updateDocument } from '@/lib/firebase/firebaseUtils';
import { Wand2, Book, Sword, Save, Bird } from 'lucide-react';
import Image from 'next/image';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
] as const;

const SKIN_TONES = [
  { value: 'light', label: 'Light', color: '#FFE0BD' },
  { value: 'medium', label: 'Medium', color: '#E5C298' },
  { value: 'dark', label: 'Dark', color: '#8D5524' },
  { value: 'olive', label: 'Olive', color: '#C68642' },
  { value: 'tan', label: 'Tan', color: '#D2B48C' },
  { value: 'deep', label: 'Deep', color: '#4C3024' }
] as const;

const HAIR_STYLES = [
  { value: 'short', label: 'Short' },
  { value: 'long', label: 'Long' },
  { value: 'curly', label: 'Curly' },
  { value: 'wavy', label: 'Wavy' },
  { value: 'braided', label: 'Braided' }
] as const;

const HAIR_COLORS = [
  { value: 'black', label: 'Black' },
  { value: 'brown', label: 'Brown' },
  { value: 'blonde', label: 'Blonde' },
  { value: 'red', label: 'Ginger' },
  { value: 'white', label: 'White' }
] as const;

const OUTFIT_STYLES = [
  { id: 'apprentice', name: 'Apprentice Robe', description: 'A simple but elegant robe for beginning wizards', isUnlocked: true },
  { id: 'scholar', name: 'Scholar\'s Attire', description: 'Traditional academic robes with magical enhancements', isUnlocked: false },
  { id: 'mage', name: 'Master Mage Robes', description: 'Ornate robes worn by accomplished spellcasters', isUnlocked: false },
] as const;

const WAND_STYLES = [
  { value: 'oak', label: 'Oak Wand' },
  { value: 'crystal', label: 'Crystal Staff' },
  { value: 'elder', label: 'Elder Wand' },
] as const;

const BOOK_STYLES = [
  { value: 'spellbook', label: 'Ancient Spellbook' },
  { value: 'grimoire', label: 'Magical Grimoire' },
  { value: 'tome', label: 'Enchanted Tome' },
] as const;

const MOUNT_STYLES = [
  { value: 'dragon', label: 'Baby Dragon' },
  { value: 'phoenix', label: 'Phoenix' },
  { value: 'unicorn', label: 'Unicorn' },
] as const;

const REGION_STYLES = [
  { id: 'mysticForest', name: 'Mystic Forest', isUnlocked: true },
  { id: 'crystalMountains', name: 'Crystal Mountains', isUnlocked: false },
  { id: 'enchantedValley', name: 'Enchanted Valley', isUnlocked: false },
  { id: 'starfallIsles', name: 'Starfall Isles', isUnlocked: false },
] as const;

const DEFAULT_AVATAR_CONFIG: CharacterCustomization = {
  gender: 'other',
  skinTone: 'light',
  region: 'mysticForest',
  hair: {
    style: 'short',
    colour: 'black'
  },
  facialFeatures: {
    eyes: 'round',
    nose: 'default',
    mouth: 'default'
  },
  outfit: {
    style: 'apprentice',
    colour: 'blue',
    isUnlocked: true
  },
  equipment: {
    wand: {
      style: 'oak',
      isUnlocked: true
    },
    book: {
      style: 'spellbook',
      isUnlocked: true
    },
    mount: {
      style: 'dragon',
      isUnlocked: true
    }
  },
  accessories: []
};

interface Props {
  child: Child;
  onClose: () => void;
}

// Add a helper function for the character description
const getCharacterDescription = (customization: CharacterCustomization) => {
  const title = customization.gender === 'male' ? 'young wizard' : 
               customization.gender === 'female' ? 'young witch' : 
               'young magician';

  const region = REGION_STYLES.find(r => r.id === customization.region)?.name;
  const outfit = OUTFIT_STYLES.find(o => o.id === customization.outfit.style)?.name;

  // Get equipment details
  const wand = WAND_STYLES.find(w => w.value === customization.equipment.wand.style)?.label;
  const book = BOOK_STYLES.find(b => b.value === customization.equipment.book.style)?.label;
  const mount = MOUNT_STYLES.find(m => m.value === customization.equipment.mount.style)?.label;

  // Build equipment string with proper grammar
  let equipmentText = '';
  if (wand && book && mount) {
    equipmentText = `wielding an ${wand} and ${book} whilst riding a ${mount}`;
  } else if (wand && book) {
    equipmentText = `wielding an ${wand} and ${book}`;
  } else if (wand && mount) {
    equipmentText = `wielding an ${wand} whilst riding a ${mount}`;
  } else if (book && mount) {
    equipmentText = `carrying a ${book} whilst riding a ${mount}`;
  } else if (wand) {
    equipmentText = `wielding an ${wand}`;
  } else if (book) {
    equipmentText = `carrying a ${book}`;
  } else if (mount) {
    equipmentText = `riding a ${mount}`;
  }

  return `A ${title} from the ${region}, wearing ${outfit}, ${equipmentText}.`;
};

const getCharacterTitle = (gender: string) => {
  switch (gender) {
    case 'male':
      return 'young wizard';
    case 'female':
      return 'young witch';
    default:
      return 'young magician';
  }
};

export default function CharacterCustomiser({ child, onClose }: Props) {
  const initialConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    ...child.avatarConfig,
    hair: {
      ...DEFAULT_AVATAR_CONFIG.hair,
      ...child.avatarConfig?.hair
    },
    facialFeatures: {
      ...DEFAULT_AVATAR_CONFIG.facialFeatures,
      ...child.avatarConfig?.facialFeatures
    },
    outfit: {
      ...DEFAULT_AVATAR_CONFIG.outfit,
      ...child.avatarConfig?.outfit
    },
    equipment: {
      ...DEFAULT_AVATAR_CONFIG.equipment,
      ...child.avatarConfig?.equipment
    }
  };

  const [customization, setCustomization] = useState<CharacterCustomization>(initialConfig);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('children', child.id, {
        avatarConfig: customization
      });
      
      const storedChild = localStorage.getItem('childUser');
      if (storedChild) {
        const updatedChild = {
          ...JSON.parse(storedChild),
          avatarConfig: customization
        };
        localStorage.setItem('childUser', JSON.stringify(updatedChild));
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving character:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleWeaponTypeSelect = (type: 'wand' | 'book' | 'mount') => {
    setCustomization(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [type]: {
          ...prev.equipment[type],
          style: getDefaultStyleForType(type)
        }
      },
      selectedEquipment: type
    }));
  };

  const getDefaultStyleForType = (type: 'wand' | 'book' | 'mount'): string => {
    switch (type) {
      case 'wand':
        return WAND_STYLES[0].value;
      case 'book':
        return BOOK_STYLES[0].value;
      case 'mount':
        return MOUNT_STYLES[0].value;
    }
  };

  const getCurrentStyleOptions = () => {
    const selectedType = customization.selectedEquipment;
    switch (selectedType) {
      case 'wand':
        return WAND_STYLES;
      case 'book':
        return BOOK_STYLES;
      case 'mount':
        return MOUNT_STYLES;
      default:
        return WAND_STYLES;
    }
  };

  const getStyleLabel = (type: 'wand' | 'book' | 'mount', style: string) => {
    const options = getCurrentStyleOptions();
    return options.find(opt => opt.value === style)?.label || style;
  };

  const getCurrentEquipmentStyle = (type: 'wand' | 'book' | 'mount') => {
    return customization.equipment[type].style;
  };

  const getCharacterPreviewImage = () => {
    // This is a placeholder - you'll need to create actual character images
    // or use a character creation API/library
    const baseUrl = '/images/characters';
    return `${baseUrl}/${customization.gender}-${customization.skinTone}-${customization.hair.style}.png`;
  };

  const getCharacterSummary = () => (
    <div className="text-sm text-gray-600 space-y-1">
      <p className="font-medium">{customization.gender.charAt(0).toUpperCase() + customization.gender.slice(1)} Character</p>
      <p>From the {REGION_STYLES.find(r => r.id === customization.region)?.name}</p>
      <p>Wearing: {OUTFIT_STYLES.find(o => o.id === customization.outfit.style)?.name}</p>
      <p>Equipment:</p>
      <ul className="list-disc list-inside pl-2">
        <li>Wand: {getStyleLabel('wand', customization.equipment.wand.style)}</li>
        <li>Book: {getStyleLabel('book', customization.equipment.book.style)}</li>
        <li>Mount: {getStyleLabel('mount', customization.equipment.mount.style)}</li>
      </ul>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Customise Your Character</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Character Preview */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Character Preview</h3>
            <div className="aspect-square bg-white rounded-lg shadow-inner flex items-center justify-center relative">
              {/* Placeholder for character preview - replace with actual character rendering */}
              <div className="w-64 h-64 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4" 
                         style={{ backgroundColor: SKIN_TONES.find(st => st.value === customization.skinTone)?.color }}>
                      {/* Basic face representation */}
                      <div className="relative w-full h-full">
                        <div className="absolute w-full top-1/2 flex justify-center">
                          <div className="w-4 h-4 bg-black rounded-full mx-1"></div>
                          <div className="w-4 h-4 bg-black rounded-full mx-1"></div>
                        </div>
                        <div className="absolute w-full top-2/3 flex justify-center">
                          <div className="w-8 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800">
                      {getCharacterDescription(customization)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-6">
            {/* Gender Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Gender</h3>
              <div className="flex gap-4">
                {GENDERS.map((gender) => (
                  <button
                    key={gender.value}
                    onClick={() => setCustomization(prev => ({ ...prev, gender: gender.value }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      customization.gender === gender.value
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gender.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Tone */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Skin Tone</h3>
              <div className="flex gap-2">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setCustomization(prev => ({ ...prev, skinTone: tone.value }))}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      customization.skinTone === tone.value ? 'border-purple-500' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: tone.color }}
                    title={tone.label}
                  >
                    {customization.skinTone === tone.value && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Hair</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style
                  </label>
                  <select
                    value={customization.hair.style}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      hair: { ...prev.hair, style: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border rounded-md text-gray-900 bg-white"
                  >
                    {HAIR_STYLES.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colour
                  </label>
                  <select
                    value={customization.hair.colour}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      hair: { ...prev.hair, colour: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border rounded-md text-gray-900 bg-white"
                  >
                    {HAIR_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Region</h3>
              <select
                value={customization.region}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  region: e.target.value
                }))}
                className="w-full px-4 py-2 border rounded-md text-gray-900 bg-white"
              >
                {REGION_STYLES.map(region => (
                  <option 
                    key={region.id} 
                    value={region.id}
                    disabled={!region.isUnlocked}
                  >
                    {region.name} {!region.isUnlocked ? '(Locked)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Outfit Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Outfit</h3>
              <select
                value={customization.outfit.style}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  outfit: { ...prev.outfit, style: e.target.value }
                }))}
                className="w-full px-4 py-2 border rounded-md text-gray-900 bg-white"
              >
                {OUTFIT_STYLES.map(outfit => (
                  <option 
                    key={outfit.id} 
                    value={outfit.id}
                    disabled={!outfit.isUnlocked}
                  >
                    {outfit.name} {!outfit.isUnlocked ? '(Locked)' : ''}
                  </option>
                ))}
              </select>
              {OUTFIT_STYLES.find(o => o.id === customization.outfit.style)?.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {OUTFIT_STYLES.find(o => o.id === customization.outfit.style)?.description}
                </p>
              )}
            </div>

            {/* Magical Equipment */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Magical Equipment</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => handleWeaponTypeSelect('wand')}
                  className={`p-4 rounded-md flex flex-col items-center gap-2 border-2 ${
                    customization.selectedEquipment === 'wand'
                      ? 'border-purple-500 bg-purple-100 text-purple-800'
                      : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Wand2 className="w-6 h-6" />
                  <span className="font-medium">Wand</span>
                </button>
                <button
                  onClick={() => handleWeaponTypeSelect('book')}
                  className={`p-4 rounded-md flex flex-col items-center gap-2 border-2 ${
                    customization.selectedEquipment === 'book'
                      ? 'border-purple-500 bg-purple-100 text-purple-800'
                      : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Book className="w-6 h-6" />
                  <span className="font-medium">Book</span>
                </button>
                <button
                  onClick={() => handleWeaponTypeSelect('mount')}
                  className={`p-4 rounded-md flex flex-col items-center gap-2 border-2 ${
                    customization.selectedEquipment === 'mount'
                      ? 'border-purple-500 bg-purple-100 text-purple-800'
                      : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Bird className="w-6 h-6" />
                  <span className="font-medium">Mount</span>
                </button>
              </div>

              {/* Equipment Style Dropdown */}
              {customization.selectedEquipment && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Your {customization.selectedEquipment.charAt(0).toUpperCase() + customization.selectedEquipment.slice(1)}
                  </label>
                  <select
                    value={customization.equipment[customization.selectedEquipment].style}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      equipment: {
                        ...prev.equipment,
                        [prev.selectedEquipment]: {
                          ...prev.equipment[prev.selectedEquipment],
                          style: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-4 py-2 border rounded-md text-gray-900 bg-white"
                  >
                    {getCurrentStyleOptions().map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Character'}
          </button>
        </div>
      </div>
    </div>
  );
} 