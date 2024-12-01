'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { updateDocument } from '@/lib/firebase/firebaseUtils';

interface Props {
  prompt: string;
  onSelectImage: (imageUrl: string) => void;
  selectedImage?: string;
  childId: string;
}

export default function CharacterImageGenerator({ prompt, onSelectImage, selectedImage, childId }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [progress, setProgress] = useState(0);

  // Show saved image when component mounts
  useEffect(() => {
    if (selectedImage) {
      setImages([selectedImage]);
      setSelectedIdx(0);
    }
  }, [selectedImage]);

  const generateImages = async () => {
    setIsGenerating(true);
    setError('');
    setProgress(0);
    setImages([]);
    setSelectedIdx(-1);
    onSelectImage(''); // Clear any previously selected image

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate images');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        throw new Error('No images were generated');
      }

      setImages(data.output);
      setProgress(100);
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedIdx(index);
    onSelectImage(images[index]);
  };

  const handleSaveImage = async () => {
    if (selectedIdx === -1 || !images[selectedIdx]) {
      setError('Please select an image to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Update the child's document with the selected image URL
      await updateDocument('children', childId, {
        'avatarConfig.avatarUrl': images[selectedIdx]
      });

      // Update local storage
      const storedChild = localStorage.getItem('childUser');
      if (storedChild) {
        const childData = JSON.parse(storedChild);
        childData.avatarConfig = {
          ...childData.avatarConfig,
          avatarUrl: images[selectedIdx]
        };
        localStorage.setItem('childUser', JSON.stringify(childData));
      }
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      {/* Current/Saved Image or Image Grid */}
      <div className="space-y-4">
        <div className={`grid ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 max-h-96 overflow-y-auto p-2`}>
          {images.map((imageUrl, idx) => (
            <div 
              key={idx}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIdx ? 'border-purple-500 shadow-lg' : 'border-transparent hover:border-purple-300'
              }`}
              onClick={() => handleSelectImage(idx)}
            >
              <img 
                src={imageUrl} 
                alt={`Character ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === selectedIdx && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        {selectedIdx !== -1 && images.length > 1 && (
          <button
            onClick={handleSaveImage}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Selected Image
              </>
            )}
          </button>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={generateImages}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : images.length > 1 ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Generate New Images
          </>
        ) : (
          images.length === 0 ? 'Generate Character Images' : 'Generate More Images'
        )}
      </button>
    </div>
  );
} 