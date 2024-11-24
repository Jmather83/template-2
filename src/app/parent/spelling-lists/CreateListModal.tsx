'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface CreateListModalProps {
  onClose: () => void;
  onSubmit: (list: {
    name: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    words: Array<{ word: string; hint?: string }>;
  }) => void;
}

export default function CreateListModal({ onClose, onSubmit }: CreateListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    difficulty: 'beginner' as const,
    words: [] as Array<{ word: string; hint?: string }>,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-centre justify-centre z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-centre mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Create New Spelling List</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-grey-700 mb-1">
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
            <label className="block text-sm font-medium text-grey-700 mb-1">
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
            <label className="block text-sm font-medium text-grey-700 mb-1">
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

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Words</h3>
            
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
                    <p className="font-medium">{word.word}</p>
                    {word.hint && <p className="text-sm text-gray-500">Hint: {word.hint}</p>}
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
              Create List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 