import { useState, useCallback, useRef } from 'react';
import type { ImportFlowState } from '@/screens/recipe-management/types/state';
import type { ImportError } from '@/screens/recipe-management/types/errors';
import type { IRecipe } from '@/screens/recipe-management/types/Recipe';
import { isRecoverableError, formatImportError } from '@/screens/recipe-management/types/errors';
import { createRecipeParsingService } from '@/screens/recipe-management/utils/parsing/jsonLdParser';
import { parseIngredientsWithProgress } from '@/services/ingredientParser';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routing/routes';

export interface UseRecipeImportReturn {
  // State
  state: ImportFlowState;
  url: string;
  jsonLdText: string;

  // Setters
  setUrl: (url: string) => void;
  setJsonLdText: (text: string) => void;

  // Actions
  parseJsonLd: () => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
  cancel: () => void;
  importRecipe: () => void;

  // Computed
  canImport: boolean;
  canRetry: boolean;
  canCancel: boolean;
  errorMessage: string | null;
}

/**
 * Hook for managing recipe import from JSON-LD with state machine pattern
 *
 * @returns Recipe import state and actions
 *
 * @example
 * ```tsx
 * function RecipeImportModal() {
 *   const {
 *     state,
 *     jsonLdText,
 *     setJsonLdText,
 *     parseJsonLd,
 *     importRecipe,
 *     canImport
 *   } = useRecipeImport();
 *
 *   return (
 *     <div>
 *       <textarea value={jsonLdText} onChange={(e) => setJsonLdText(e.target.value)} />
 *       {state.status === 'idle' && <button onClick={parseJsonLd}>Parse</button>}
 *       {state.status === 'complete' && <button onClick={importRecipe} disabled={!canImport}>Import</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecipeImport(): UseRecipeImportReturn {
  const navigate = useNavigate();

  // Input state
  const [url, setUrl] = useState('');
  const [jsonLdText, setJsonLdText] = useState('');

  // Import flow state machine
  const [state, setState] = useState<ImportFlowState>({ status: 'idle' });

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create parsing service (singleton)
  const parsingService = useRef(createRecipeParsingService());

  // Session management: Generate unique session ID for each import operation
  // This prevents state conflicts when importing multiple recipes in succession
  const sessionIdRef = useRef<string | null>(null);

  /**
   * Generates a new session ID for the current import operation
   */
  const generateSessionId = useCallback(() => {
    sessionIdRef.current = `import-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return sessionIdRef.current;
  }, []);

  /**
   * Parse JSON-LD and optionally parse ingredients
   */
  const parseJsonLd = useCallback(async () => {
    if (!jsonLdText.trim()) {
      const error: ImportError = {
        type: 'validation',
        errors: [
          {
            type: 'missing_required_field',
            field: 'jsonLdText',
            message: 'Please paste JSON-LD data',
            severity: 'error',
          },
        ],
      };

      setState({
        status: 'error',
        error,
        startedAt: Date.now(),
        recoverable: true,
        failedAt: Date.now(),
      });
      return;
    }

    try {
      // Generate new session ID for this import operation
      const currentSessionId = generateSessionId();

      // Start JSON parsing phase
      const parsingStartTime = Date.now();
      setState({
        status: 'parsing-json',
        startedAt: parsingStartTime,
      });

      // Let React flush state update to UI
      await Promise.resolve();

      // Parse JSON-LD
      const result = await parsingService.current.parseJsonLd(jsonLdText, {
        sourceUrl: url || undefined,
        validationMode: 'lenient',
      });

      if (!result.success) {
        // Convert validation errors to ImportError
        const error: ImportError = {
          type: 'validation',
          errors: result.errors,
        };

        setState({
          status: 'error',
          error,
          startedAt: parsingStartTime,
          recoverable: true,
          failedAt: Date.now(),
        });
        return;
      }

      // Check if recipe has ingredients to parse
      const hasIngredients = result.recipe?.recipeIngredient && result.recipe.recipeIngredient.length > 0;

      if (!hasIngredients) {
        // No ingredients to parse - complete immediately
        setState({
          status: 'complete',
          recipe: result.recipe!,
          startedAt: parsingStartTime,
          completedAt: Date.now(),
          warnings: result.warnings,
        });
        return;
      }

      // Start ingredient parsing phase
      setState({
        status: 'parsing-ingredients',
        current: 0,
        total: result.recipe!.recipeIngredient!.length,
        startedAt: Date.now(),
      });

      // Create abort controller for cancellation support
      abortControllerRef.current = new AbortController();

      // Parse ingredients with progress tracking
      const ingredientResult = await parseIngredientsWithProgress(
        result.recipe!.recipeIngredient!,
        {
          onProgress: (current: number, total: number) => {
            // Only update state if this is still the current session
            if (sessionIdRef.current === currentSessionId) {
              setState({
                status: 'parsing-ingredients',
                current,
                total,
                startedAt: parsingStartTime,
              });
            }
          },
          signal: abortControllerRef.current.signal,
        }
      );

      // Check if session is still valid before updating state
      if (sessionIdRef.current !== currentSessionId) {
        // Session has been superseded by another import, ignore results
        return;
      }

      // Add parsed ingredients to recipe
      const finalRecipe: Partial<IRecipe> = {
        ...result.recipe,
        parsedIngredients: ingredientResult.parsedIngredients,
        ingredientParsingCompleted: true,
        ingredientParsingDate: new Date(),
      };

      // Combine warnings from JSON-LD parsing and ingredient parsing
      const allWarnings = [...result.warnings];
      if (ingredientResult.failedIngredients.length > 0) {
        allWarnings.push({
          type: 'low_confidence',
          message: `${ingredientResult.failedIngredients.length} ingredients could not be parsed automatically`,
          actionable: true,
          severity: 'warning',
        });
      }

      // Complete successfully (only if session is still valid)
      if (sessionIdRef.current === currentSessionId) {
        setState({
          status: 'complete',
          recipe: finalRecipe,
          startedAt: parsingStartTime,
          completedAt: Date.now(),
          warnings: allWarnings,
        });
      }
    } catch (error) {
      // Handle errors during parsing
      let importError: ImportError;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User cancelled - reset to idle
          setState({ status: 'idle' });
          return;
        }

        // Check if it's a JSON parse error
        if (error.message.includes('JSON')) {
          importError = {
            type: 'json_parse',
            message: 'Invalid JSON format',
            details: error.message,
          };
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          importError = {
            type: 'network',
            message: error.message,
            retryable: true,
          };
        } else if (error.message.includes('timeout')) {
          importError = {
            type: 'timeout',
            operation: 'Recipe parsing',
            timeoutMs: 5000,
          };
        } else {
          // Generic network/system error
          importError = {
            type: 'network',
            message: error.message || 'An unexpected error occurred',
            retryable: true,
          };
        }
      } else {
        // Unknown error type
        importError = {
          type: 'network',
          message: 'An unexpected error occurred',
          retryable: true,
        };
      }

      setState({
        status: 'error',
        error: importError,
        startedAt: Date.now(),
        recoverable: isRecoverableError(importError),
        failedAt: Date.now(),
      });
    }
  }, [jsonLdText, url]);

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    // Cancel any in-progress operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear session ID to invalidate any in-flight operations
    sessionIdRef.current = null;

    setState({ status: 'idle' });
    setUrl('');
    setJsonLdText('');
  }, []);

  /**
   * Retry parsing after an error
   */
  const retry = useCallback(async () => {
    if (state.status === 'error' && state.recoverable) {
      await parseJsonLd();
    }
  }, [state, parseJsonLd]);

  /**
   * Cancel in-progress operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Import recipe and navigate to edit screen
   */
  const importRecipe = useCallback(() => {
    if (state.status === 'complete' && state.recipe) {
      navigate(ROUTES.RECIPE_ADD, { state: { importedRecipe: state.recipe } });
      reset();
    }
  }, [state, navigate, reset]);

  // Computed properties
  const canImport =
    state.status === 'complete' &&
    !!state.recipe?.name &&
    !!state.recipe?.image;

  const canRetry = state.status === 'error' && state.recoverable;

  const canCancel = state.status === 'parsing-ingredients';

  const errorMessage =
    state.status === 'error' ? formatImportError(state.error) : null;

  return {
    state,
    url,
    jsonLdText,
    setUrl,
    setJsonLdText,
    parseJsonLd,
    reset,
    retry,
    cancel,
    importRecipe,
    canImport,
    canRetry,
    canCancel,
    errorMessage,
  };
}
