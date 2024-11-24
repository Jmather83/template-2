'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Child, WordList } from '@/types';

interface AssignListModalProps {
  list: WordList;
  children: Child[];
  onClose: () => void;
  onAssign: (childIds: string[]) => void;
}

export default function AssignListModal({ list, children, onClose, onAssign }: AssignListModalProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>(list.assignedTo || []);

  const handleToggleChild = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedChildren);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Assign List</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">{list.name}</h3>
          <p className="text-sm text-gray-500">Select children to assign this list to:</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            {children.map((child) => (
              <label
                key={child.id}
                className="flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedChildren.includes(child.id)}
                  onChange={() => handleToggleChild(child.id)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-3">
                  <span className="block font-medium text-gray-900">{child.realName}</span>
                  <span className="block text-sm text-gray-500">Plays as: {child.displayName}</span>
                </span>
              </label>
            ))}
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
              Save Assignments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 