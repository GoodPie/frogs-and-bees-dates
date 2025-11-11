import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/FirebaseConfig.ts';
import type {IRecipe} from "@/screens/recipe-management/types/Recipe.ts";

/**
 * Custom hook to fetch all recipes from Firestore
 * @returns Object with recipes array, loading state, and error
 */
export const useRecipes = () => {
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                setLoading(true);
                setError(null);

                const recipesQuery = query(
                    collection(db, 'recipes'),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(recipesQuery);
                const fetchedRecipes: IRecipe[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedRecipes.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate(),
                        datePublished: data.datePublished?.toDate(),
                        ingredientParsingDate: data.ingredientParsingDate?.toDate(),
                    } as IRecipe);
                });

                setRecipes(fetchedRecipes);
            } catch (err) {
                console.error('Error fetching recipes:', err);
                setError('Failed to load recipes. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    return { recipes, loading, error };
};
