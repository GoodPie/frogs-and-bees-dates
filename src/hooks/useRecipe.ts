import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import type {IRecipe} from '@/interfaces/IRecipe';

/**
 * Custom hook to fetch a single recipe by ID from Firestore
 * @param recipeId - The ID of the recipe to fetch
 * @returns Object with recipe, loading state, and error
 */
export const useRecipe = (recipeId: string | undefined) => {
    const [recipe, setRecipe] = useState<IRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!recipeId) {
            setLoading(false);
            return;
        }

        const fetchRecipe = async () => {
            try {
                setLoading(true);
                setError(null);

                const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));

                if (recipeDoc.exists()) {
                    const data = recipeDoc.data();
                    setRecipe({
                        id: recipeDoc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate(),
                        datePublished: data.datePublished?.toDate(),
                    } as IRecipe);
                } else {
                    setError('Recipe not found');
                }
            } catch (err) {
                console.error('Error fetching recipe:', err);
                setError('Failed to load recipe. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [recipeId]);

    return { recipe, loading, error };
};
