'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments, addDocument, deleteDocument, updateDocument } from '@/lib/firebase/firebaseUtils';
import { WordList, Child } from '@/types';
import { Plus, Trash2, Users, Edit2 } from 'lucide-react';
import ParentDashboardLayout from '@/components/layouts/ParentDashboardLayout';
import CreateListModal from './CreateListModal';
import AssignListModal from './AssignListModal';

export default function SpellingLists() {
  const { user } = useAuth();
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listsData, childrenData] = await Promise.all([
          getDocuments('wordLists') as Promise<WordList[]>,
          getDocuments('children') as Promise<Child[]>,
        ]);
        setWordLists(listsData);
        setChildren(childrenData.filter(child => child.parentId === user?.uid));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateList = async (newList: {
    name: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    words: Array<{ word: string; hint?: string }>;
    isActive: boolean;
  }) => {
    try {
      await addDocument('wordLists', {
        ...newList,
        assignedTo: [],
      });
      setShowCreateModal(false);
      // Refresh lists
      const listsData = await getDocuments('wordLists') as WordList[];
      setWordLists(listsData);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleAssignList = async (childIds: string[]) => {
    if (!selectedList) return;

    try {
      await updateDocument('wordLists', selectedList.id, {
        assignedTo: childIds,
      });
      setShowAssignModal(false);
      // Refresh lists
      const listsData = await getDocuments('wordLists') as WordList[];
      setWordLists(listsData);
    } catch (error) {
      console.error('Error assigning list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      await deleteDocument('wordLists', listId);
      setWordLists(prev => prev.filter(list => list.id !== listId));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleEditList = async (editedList: WordList) => {
    try {
      await updateDocument('wordLists', editedList.id, {
        name: editedList.name,
        category: editedList.category,
        difficulty: editedList.difficulty,
        words: editedList.words,
        isActive: editedList.isActive
      });
      
      // Refresh lists
      const listsData = await getDocuments('wordLists') as WordList[];
      setWordLists(listsData);
      setShowEditModal(false);
      setSelectedList(null);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  if (loading) {
    return (
      <ParentDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl text-purple-800">Loading...</div>
        </div>
      </ParentDashboardLayout>
    );
  }

  return (
    <ParentDashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Spelling Lists</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create New List</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wordLists.map((list) => (
            <div key={list.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{list.name}</h3>
                    {list.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Category: {list.category}</p>
                  <p className="text-sm text-gray-500">
                    Difficulty: {list.difficulty}
                  </p>
                  <p className="text-sm text-gray-500">
                    Words: {list.words.length}
                  </p>
                  <p className="text-sm text-gray-500">
                    Assigned to: {list.assignedTo?.length || 0} children
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedList(list);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 transition"
                    title="Edit list"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedList(list);
                      setShowAssignModal(true);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 transition"
                    title="Assign to children"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2 text-red-500 hover:text-red-700 transition"
                    title="Delete list"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create List Modal */}
        {showCreateModal && (
          <CreateListModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateList}
          />
        )}

        {/* Edit List Modal */}
        {showEditModal && selectedList && (
          <CreateListModal
            onClose={() => {
              setShowEditModal(false);
              setSelectedList(null);
            }}
            onSubmit={(editedData) => handleEditList({ ...selectedList, ...editedData })}
            initialData={selectedList}
          />
        )}

        {/* Assignment Modal */}
        {showAssignModal && selectedList && (
          <AssignListModal
            list={selectedList}
            children={children}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedList(null);
            }}
            onAssign={handleAssignList}
          />
        )}
      </div>
    </ParentDashboardLayout>
  );
} 