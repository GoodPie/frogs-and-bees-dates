import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { auth } from '@/FirebaseConfig';
import { validateImageUrl } from '@/utils/recipeValidation';

/**
 * Custom hook for handling recipe image uploads and URL validation
 * @returns Object with upload function, validation, loading state, and error
 */
export const useRecipeImage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Upload an image file to Firebase Storage
     * @param file - Image file to upload
     * @returns The download URL of the uploaded image, or null on failure
     */
    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            setLoading(true);
            setError(null);

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
                return null;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                setError('File size too large. Please upload an image smaller than 5MB.');
                return null;
            }

            // Create storage reference
            const storage = getStorage();
            const userId = auth.currentUser?.uid || 'anonymous';
            const timestamp = Date.now();
            const fileName = `recipes/${userId}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Validate an image URL
     * @param url - Image URL to validate
     * @returns True if URL is valid, false otherwise
     */
    const validateUrl = (url: string): boolean => {
        const isValid = validateImageUrl(url);
        if (!isValid) {
            setError('Invalid image URL. Please provide a valid HTTP or HTTPS URL.');
        }
        return isValid;
    };

    return {
        uploadImage,
        validateUrl,
        loading,
        error,
    };
};
