'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { WordList } from '@/types';

interface CreateListModalProps {
  onClose: () => void;
  onSubmit: (list: {
    name: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    words: Array<{ word: string; hint?: string }>;
    isActive: boolean;
  }) => void;
  initialData?: WordList;
}

export default function CreateListModal({ onClose, onSubmit, initialData }: CreateListModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    difficulty: initialData?.difficulty || 'beginner' as const,
    words: initialData?.words || [] as Array<{ word: string; hint?: string }>,
    isActive: initialData?.isActive ?? true,
  });
  const [newWord, setNewWord] = useState({ word: '', hint: '' });

  const handleAddWord = () => {
    if (newWord.word.trim()) {
      setFormData(prev => ({
        ...prev,
        words: [...prev.words, { word: newWord.word.trim(), hint: newWord.hint.trim() }],
      }));
      setNewWord({ word: '', hint: '' });
    }
  };

  const handleRemoveWord = (index: number) => {
    setFormData(prev => ({
      ...prev,
      words: prev.words.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.words.length === 0) {
      alert('Please add at least one word to the list');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">
            {initialData ? 'Edit Spelling List' : 'Create New Spelling List'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              List Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-900">Active (available for tests and word searches)</span>
            </label>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Words</h3>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter word"
                  value={newWord.word}
                  onChange={(e) => setNewWord(prev => ({ ...prev, word: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter hint (optional)"
                  value={newWord.hint}
                  onChange={(e) => setNewWord(prev => ({ ...prev, hint: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <button
                type="button"
                onClick={handleAddWord}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {formData.words.map((word, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{word.word}</p>
                    {word.hint && <p className="text-sm text-gray-700">Hint: {word.hint}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
            >
              {initialData ? 'Save Changes' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 