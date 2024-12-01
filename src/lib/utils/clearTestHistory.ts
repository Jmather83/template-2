import { getDocuments, updateDocument } from '@/lib/firebase/firebaseUtils';
import { Child } from '@/types';

export const clearTestHistory = async () => {
  try {
    // Get all children
    const children = await getDocuments('children') as Child[];
    
    // Update each child
    const updates = children.map(child => 
      updateDocument('children', child.id, {
        testHistory: [],
        progress: {
          ...child.progress,
          completedQuests: 0,
          accuracy: 0
        }
      })
    );

    await Promise.all(updates);

    // Clear local storage if any child is logged in
    const storedChild = localStorage.getItem('childUser');
    if (storedChild) {
      const parsedChild = JSON.parse(storedChild);
      const updatedChild = {
        ...parsedChild,
        testHistory: [],
        progress: {
          ...parsedChild.progress,
          completedQuests: 0,
          accuracy: 0
        }
      };
      localStorage.setItem('childUser', JSON.stringify(updatedChild));
    }

    console.log('Test history cleared successfully');
  } catch (error) {
    console.error('Error clearing test history:', error);
  }
}; 