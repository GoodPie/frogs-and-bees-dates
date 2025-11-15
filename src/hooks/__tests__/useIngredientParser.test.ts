/**
 * Tests for useIngredientParser hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIngredientParser } from '../useIngredientParser';

describe('useIngredientParser', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useIngredientParser());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.parseIngredients).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should set loading state during parsing', async () => {
    const { result } = renderHook(() => useIngredientParser());

    // Setup mock
    const { getGenerativeModel } = (global as any).__firebaseMocks;
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([{
            quantity: "2",
            unit: "cups",
            ingredientName: "flour",
            confidence: 0.95,
          }]),
        },
      }),
    });

    // Start parsing (don't await immediately)
    let parsePromise: Promise<any>;
    act(() => {
      parsePromise = result.current.parseIngredients(["2 cups flour"]);
    });

    // Check loading state is true
    expect(result.current.isLoading).toBe(true);

    // Wait for completion
    await act(async () => {
      await parsePromise;
    });

    // Check loading state is false after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('should return parsed ingredients on success', async () => {
    const { result } = renderHook(() => useIngredientParser());

    // Setup mock
    const { getGenerativeModel } = (global as any).__firebaseMocks;
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([{
            quantity: "2",
            unit: "cups",
            ingredientName: "flour",
            metricQuantity: "240",
            metricUnit: "g",
            confidence: 0.95,
          }]),
        },
      }),
    });

    let parsed;
    await act(async () => {
      parsed = await result.current.parseIngredients(["2 cups flour"]);
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      quantity: "2",
      unit: "cup",
      ingredientName: "flour",
      metricQuantity: "240",
      metricUnit: "g",
    });
    expect(result.current.error).toBeNull();
  });

  it('should set error state on parsing failure', async () => {
    const { result } = renderHook(() => useIngredientParser());

    // Setup mock to throw error
    const { getGenerativeModel } = (global as any).__firebaseMocks;
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('network error')),
    });

    // Expect the promise to reject
    await act(async () => {
      try {
        await result.current.parseIngredients(["2 cups flour"]);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to connect to Firebase AI Logic');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear error when clearError is called', async () => {
    const { result } = renderHook(() => useIngredientParser());

    // Setup mock to throw error
    const { getGenerativeModel } = (global as any).__firebaseMocks;
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('network error')),
    });

    // Trigger error
    await act(async () => {
      try {
        await result.current.parseIngredients(["2 cups flour"]);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).not.toBeNull();

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle multiple sequential parses', async () => {
    const { result } = renderHook(() => useIngredientParser());

    // Setup mock
    const { getGenerativeModel } = (global as any).__firebaseMocks;
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn()
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify([{
              ingredientName: "flour",
              confidence: 0.95,
            }]),
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify([{
              ingredientName: "salt",
              confidence: 0.98,
            }]),
          },
        }),
    });

    // First parse
    let result1;
    await act(async () => {
      result1 = await result.current.parseIngredients(["2 cups flour"]);
    });
    expect(result1[0].ingredientName).toBe("flour");

    // Second parse
    let result2;
    await act(async () => {
      result2 = await result.current.parseIngredients(["1 tsp salt"]);
    });
    expect(result2[0].ingredientName).toBe("salt");

    expect(result.current.error).toBeNull();
  });

  it('should clear previous error on new parse attempt', async () => {
    const { result } = renderHook(() => useIngredientParser());

    const { getGenerativeModel } = (global as any).__firebaseMocks;

    // First parse fails
    getGenerativeModel.mockReturnValueOnce({
      generateContent: vi.fn().mockRejectedValue(new Error('network error')),
    });

    await act(async () => {
      try {
        await result.current.parseIngredients(["2 cups flour"]);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).not.toBeNull();

    // Second parse succeeds
    getGenerativeModel.mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([{
            ingredientName: "flour",
            confidence: 0.95,
          }]),
        },
      }),
    });

    await act(async () => {
      await result.current.parseIngredients(["2 cups flour"]);
    });

    expect(result.current.error).toBeNull();
  });
});
