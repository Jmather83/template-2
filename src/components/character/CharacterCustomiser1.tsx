'use client';

import { useState } from 'react';
import { Child, CharacterCustomization } from '@/types';
import { updateDocument } from '@/lib/firebase/firebaseUtils';
import { Wand2, Book, Bird, Save } from 'lucide-react';
import Image from 'next/image';

interface Props {
  child: Child;
  onClose: () => void;
}

export default function CharacterCustomiser({ child, onClose }: Props) {
  // ... rest of the component code ...
} 