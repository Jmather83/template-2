'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDocuments, deleteDocument } from '@/lib/firebase/firebaseUtils';
import { Child } from '@/types';
import Link from 'next/link';
import { Trash2, AlertTriangle } from 'lucide-react';
import ParentDashboardLayout from '@/components/layouts/ParentDashboardLayout';

export default function ParentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  const fetchChildren = async () => {
    try {
      const childrenDocs = await getDocuments('children') as Child[];
      const userChildren = childrenDocs.filter(child => child.parentId === user?.uid);
      setChildren(userChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchChildren();
  }, [user, router]);

  const handleDeleteClick = (child: Child) => {
    setChildToDelete(child);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!childToDelete) return;

    setDeleteLoading(childToDelete.id);
    try {
      await deleteDocument('children', childToDelete.id);
      await fetchChildren(); // Refresh the list
      setShowDeleteModal(false);
      setChildToDelete(null);
    } catch (error) {
      console.error('Error deleting child profile:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setChildToDelete(null);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-purple-800">Child Profiles</h1>
          <Link
            href="/parent/add-child"
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Add Child Profile
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to SpellQuest Adventure!
            </h2>
            <p className="text-gray-600 mb-6">
              Get started by creating a profile for your child.
            </p>
            <Link
              href="/parent/add-child"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
            >
              Create First Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-lg p-6 shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-purple-800">
                      {child.realName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Plays as: {child.displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Wizard Name: {child.username}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(child)}
                    disabled={deleteLoading === child.id}
                    className="text-red-500 hover:text-red-700 transition p-2"
                    aria-label="Delete profile"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="text-gray-600 mb-4">
                  <p>Age: {child.age}</p>
                  <p>Level: {child.difficultyLevel}</p>
                  <p>Quests Completed: {child.progress.completedQuests}</p>
                </div>
                <div className="flex justify-between">
                  <Link
                    href={`/parent/child/${child.id}`}
                    className="text-purple-600 hover:text-purple-800 transition"
                  >
                    View Progress
                  </Link>
                  <Link
                    href={`/parent/child/${child.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && childToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500 h-6 w-6" />
                <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the profile for <span className="font-semibold">{childToDelete.realName}</span>?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-700">
                    Warning: This action cannot be undone. All progress, including:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                    <li>Game progress and achievements</li>
                    <li>Collected rewards and items</li>
                    <li>Customised character settings</li>
                    <li>Learning history and statistics</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading === childToDelete.id}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleteLoading === childToDelete.id ? 'Deleting...' : 'Delete Profile'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentDashboardLayout>
  );
} 