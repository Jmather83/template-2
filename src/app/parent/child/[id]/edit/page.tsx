'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments, updateDocument } from '@/lib/firebase/firebaseUtils';
import { Child } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function EditChildProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    realName: '',
    displayName: '',
    age: '',
    difficultyLevel: 'beginner' as const,
  });

  useEffect(() => {
    const fetchChild = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const childDoc = await getDoc(doc(db, 'children', params.id));
        if (!childDoc.exists()) {
          router.push('/parent/dashboard');
          return;
        }

        const childData = childDoc.data() as Child;
        // Verify this child belongs to the current parent
        if (childData.parentId !== user.uid) {
          router.push('/parent/dashboard');
          return;
        }

        setFormData({
          realName: childData.realName,
          displayName: childData.displayName,
          age: childData.age.toString(),
          difficultyLevel: childData.difficultyLevel,
        });
      } catch (err) {
        console.error('Error fetching child:', err);
        setError('Failed to load child profile');
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [user, router, params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateDocument('children', params.id, {
        realName: formData.realName,
        displayName: formData.displayName,
        age: parseInt(formData.age),
        difficultyLevel: formData.difficultyLevel,
      });

      router.push('/parent/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-purple-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">
              Edit Child Profile
            </h1>
            <button
              onClick={() => router.push('/parent/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          </div>

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
              <p className="text-xs text-gray-500 mt-1">
                This name will be shown in the game interface
              </p>
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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/parent/dashboard')}
                className="w-1/2 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-1/2 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 