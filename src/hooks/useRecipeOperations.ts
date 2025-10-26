import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/FirebaseConfig';
import { IRecipe } from '@/interfaces/IRecipe';
import { validateRecipe, sanitizeRecipe } from '@/utils/recipeValidation';

/**
 * Custom hook for recipe CRUD operations
 * @returns Object with operation functions, loading state, and error
 */
export const useRecipeOperations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Add a new recipe to Firestore
     * @param recipe - Recipe data to add
     * @returns The ID of the newly created recipe, or null on failure
     */
    const addRecipe = async (recipe: Partial<IRecipe>): Promise<string | null> => {
        try {
            setLoading(true);
            setError(null);

            // Validate recipe
            const validation = validateRecipe(recipe);
            if (!validation.isValid) {
                setError(validation.errors.join(', '));
                return null;
            }

            // Sanitize recipe data
            const sanitized = sanitizeRecipe(recipe);

            // Add metadata
            const recipeData = {
                ...sanitized,
                createdBy: auth.currentUser?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'recipes'), recipeData);
            return docRef.id;
        } catch (err) {
            console.error('Error adding recipe:', err);
            setError('Failed to add recipe. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing recipe in Firestore
     * @param recipeId - ID of the recipe to update
     * @param recipe - Updated recipe data
     * @returns True on success, false on failure
     */
    const updateRecipe = async (recipeId: string, recipe: Partial<IRecipe>): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            // Validate recipe
            const validation = validateRecipe(recipe);
            if (!validation.isValid) {
                setError(validation.errors.join(', '));
                return false;
            }

            // Sanitize recipe data
            const sanitized = sanitizeRecipe(recipe);

            // Update with metadata
            const recipeData = {
                ...sanitized,
                updatedAt: serverTimestamp(),
            };

            await updateDoc(doc(db, 'recipes', recipeId), recipeData);
            return true;
        } catch (err) {
            console.error('Error updating recipe:', err);
            setError('Failed to update recipe. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete a recipe from Firestore
     * @param recipeId - ID of the recipe to delete
     * @returns True on success, false on failure
     */
    const deleteRecipe = async (recipeId: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            await deleteDoc(doc(db, 'recipes', recipeId));
            return true;
        } catch (err) {
            console.error('Error deleting recipe:', err);
            setError('Failed to delete recipe. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        addRecipe,
        updateRecipe,
        deleteRecipe,
        loading,
        error,
    };
};
