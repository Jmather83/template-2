import { getDocuments } from '../firebase/firebaseUtils';
import { generateWizardName } from './nameGenerator';
import { db } from '../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const updateExistingChildAccounts = async () => {
  try {
    const children = await getDocuments('children');
    const existingNames = children.map(child => child.username);
    
    for (const child of children) {
      if (!child.username.includes('Mystic') && !child.username.includes('Arcane')) {
        const newWizardName = await generateWizardName(existingNames);
        existingNames.push(newWizardName);
        
        // Update the child's document with the new wizard name
        const childRef = doc(db, 'children', child.id);
        await updateDoc(childRef, {
          username: newWizardName,
          displayName: child.username // Save old username as display name
        });
      }
    }
  } catch (error) {
    console.error('Error updating existing accounts:', error);
    throw error;
  }
}; 