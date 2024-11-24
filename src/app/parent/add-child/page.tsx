'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { addDocument, getDocuments } from '@/lib/firebase/firebaseUtils';
import { generateWizardName } from '@/lib/utils/nameGenerator';
import { Child } from '@/types';

const DEFAULT_AVATAR_CONFIG: CharacterCustomisation = {
  skinTone: 'light',
  hair: {
    style: 'short',
    color: 'black'
  },
  facialFeatures: {
    eyes: 'round',
    nose: 'default',
    mouth: 'default'
  },
  outfit: {
    style: 'apprentice',
    color: 'blue',
    isUnlocked: true
  },
  accessories: [],
  weapon: {
    type: 'wand',
    style: 'basic',
    isUnlocked: true
  }
};

export default function AddChild() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wizardName, setWizardName] = useState('');

  const [formData, setFormData] = useState({
    realName: '',
    displayName: '',
    pin: '',
    confirmPin: '',
    age: '',
    difficultyLevel: 'beginner' as const,
  });

  useEffect(() => {
    const generateUniqueName = async () => {
      try {
        const children = await getDocuments('children') as Child[];
        const existingNames = children.map(child => child.username);
        const newWizardName = await generateWizardName(existingNames);
        setWizardName(newWizardName);
      } catch (err) {
        console.error('Error generating wizard name:', err);
        setError('Failed to generate wizard name');
      }
    };

    generateUniqueName();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      setLoading(false);
      return;
    }

    if (formData.pin.length !== 4) {
      setError('PIN must be 4 digits');
      setLoading(false);
      return;
    }

    try {
      const childData = {
        parentId: user?.uid,
        username: wizardName,
        realName: formData.realName,
        displayName: formData.displayName,
        pin: formData.pin,
        age: parseInt(formData.age),
        difficultyLevel: formData.difficultyLevel,
        avatarConfig: DEFAULT_AVATAR_CONFIG,
        progress: {
          coins: 0,
          gems: 0,
          completedQuests: 0,
          accuracy: 0,
        },
        createdAt: new Date().toISOString(),
      };

      await addDocument('children', childData);
      router.push('/parent/dashboard');
    } catch (err) {
      setError('Failed to create child profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">
              Create Child Profile
            </h1>
            <button
              onClick={() => router.push('/parent/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          </div>

          {wizardName && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Wizard Name:</p>
              <p className="text-lg font-semibold text-purple-800">{wizardName}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Real Name
              </label>
              <input
                type="text"
                name="realName"
                value={formData.realName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter your child's real name"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your child can customise their character after logging in
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter a character name"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your child can customise their character after logging in
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN (4 digits)
              </label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                maxLength={4}
                pattern="\d{4}"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter 4-digit PIN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm PIN
              </label>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                maxLength={4}
                pattern="\d{4}"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Confirm 4-digit PIN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="4"
                max="12"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                placeholder="Enter age (4-12)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 