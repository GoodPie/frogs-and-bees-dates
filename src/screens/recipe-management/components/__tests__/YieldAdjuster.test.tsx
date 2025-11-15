import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { YieldAdjuster } from '../YieldAdjuster';
import type { YieldAdjustmentState } from '@/screens/recipe-management/types/Recipe';

// Wrapper for Chakra UI components
const renderWithChakra = (component: React.ReactElement) => {
    return render(<ChakraProvider value={defaultSystem}>{component}</ChakraProvider>);
};

const defaultYieldState: YieldAdjustmentState = {
    originalYield: 4,
    currentYield: 4,
    yieldMultiplier: 1.0,
    isAdjusted: false,
    originalYieldString: '4 servings',
};

const adjustedYieldState: YieldAdjustmentState = {
    originalYield: 4,
    currentYield: 6,
    yieldMultiplier: 1.5,
    isAdjusted: true,
    originalYieldString: '4 servings',
};

describe('YieldAdjuster', () => {
    afterEach(() => {
        cleanup();
    });

    describe('rendering', () => {
        it('should render increment and decrement buttons', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const incrementButton = screen.getByLabelText('Increase servings');
            const decrementButton = screen.getByLabelText('Decrease servings');

            expect(incrementButton).toBeDefined();
            expect(decrementButton).toBeDefined();
        });

        it('should display current yield value', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const input = screen.getByRole('spinbutton') as HTMLInputElement;
            expect(input.value).toBe('4');
        });

        it('should show adjusted badge when isAdjusted is true', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={adjustedYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const badge = screen.getByText('Adjusted');
            expect(badge).toBeDefined();
        });

        it('should not show adjusted badge when isAdjusted is false', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const badge = screen.queryByText('Adjusted');
            expect(badge).toBeNull();
        });

        it('should show reset button when isAdjusted is true', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={adjustedYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const resetButton = screen.getByText('Reset');
            expect(resetButton).toBeDefined();
        });

        it('should not show reset button when isAdjusted is false', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const resetButton = screen.queryByText('Reset');
            expect(resetButton).toBeNull();
        });

        it('should display original yield string if present', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const originalText = screen.getByText(/Original: 4 servings/);
            expect(originalText).toBeDefined();
        });

        it('should not display original yield text if not present', () => {
            const stateWithoutString = { ...defaultYieldState, originalYieldString: undefined };
            renderWithChakra(
                <YieldAdjuster
                    yieldState={stateWithoutString}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const originalText = screen.queryByText(/Original:/);
            expect(originalText).toBeNull();
        });

        it('should display error message when error prop is set', () => {
            const error = {
                type: 'below_minimum' as const,
                message: 'Minimum yield is 2.0 servings',
                suggestedValue: 2,
            };

            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                    error={error}
                />
            );

            const errorMessage = screen.getByText('Minimum yield is 2.0 servings');
            expect(errorMessage).toBeDefined();
        });
    });

    describe('interactions', () => {
        it('should call onIncrement when increment button is clicked', () => {
            const onIncrement = vi.fn();
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={onIncrement}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const incrementButton = screen.getByLabelText('Increase servings');
            fireEvent.click(incrementButton);

            expect(onIncrement).toHaveBeenCalledTimes(1);
        });

        it('should call onDecrement when decrement button is clicked', () => {
            const onDecrement = vi.fn();
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={onDecrement}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const decrementButton = screen.getByLabelText('Decrease servings');
            fireEvent.click(decrementButton);

            expect(onDecrement).toHaveBeenCalledTimes(1);
        });

        it('should call onReset when reset button is clicked', () => {
            const onReset = vi.fn();
            renderWithChakra(
                <YieldAdjuster
                    yieldState={adjustedYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={onReset}
                    onDirectInput={vi.fn()}
                />
            );

            const resetButton = screen.getByText('Reset');
            fireEvent.click(resetButton);

            expect(onReset).toHaveBeenCalledTimes(1);
        });

        it('should call onDirectInput when user types in input field', () => {
            const onDirectInput = vi.fn();
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={onDirectInput}
                />
            );

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '6' } });

            expect(onDirectInput).toHaveBeenCalledWith(6);
        });
    });

    describe('button disabled states', () => {
        it('should disable increment button at maximum', () => {
            const maxState: YieldAdjustmentState = {
                originalYield: 4,
                currentYield: 40, // 4 * 10 = maximum
                yieldMultiplier: 10,
                isAdjusted: true,
            };

            renderWithChakra(
                <YieldAdjuster
                    yieldState={maxState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const incrementButton = screen.getByLabelText('Increase servings') as HTMLButtonElement;
            expect(incrementButton.disabled).toBe(true);
        });

        it('should disable decrement button at minimum', () => {
            const minState: YieldAdjustmentState = {
                originalYield: 4,
                currentYield: 2, // 4 * 0.5 = minimum
                yieldMultiplier: 0.5,
                isAdjusted: true,
            };

            renderWithChakra(
                <YieldAdjuster
                    yieldState={minState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const decrementButton = screen.getByLabelText('Decrease servings') as HTMLButtonElement;
            expect(decrementButton.disabled).toBe(true);
        });

        it('should not disable buttons when within bounds', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const incrementButton = screen.getByLabelText('Increase servings') as HTMLButtonElement;
            const decrementButton = screen.getByLabelText('Decrease servings') as HTMLButtonElement;

            expect(incrementButton.disabled).toBe(false);
            expect(decrementButton.disabled).toBe(false);
        });
    });

    describe('accessibility', () => {
        it('should have aria-label on increment button', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const button = screen.getByLabelText('Increase servings');
            expect(button).toBeDefined();
        });

        it('should have aria-label on decrement button', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const button = screen.getByLabelText('Decrease servings');
            expect(button).toBeDefined();
        });

        it('should have aria-label on reset button', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={adjustedYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const button = screen.getByLabelText('Reset to original servings');
            expect(button).toBeDefined();
        });

        it('should have keyboard focusable buttons', () => {
            renderWithChakra(
                <YieldAdjuster
                    yieldState={defaultYieldState}
                    onIncrement={vi.fn()}
                    onDecrement={vi.fn()}
                    onReset={vi.fn()}
                    onDirectInput={vi.fn()}
                />
            );

            const incrementButton = screen.getByLabelText('Increase servings');
            const decrementButton = screen.getByLabelText('Decrease servings');

            expect(incrementButton.tagName).toBe('BUTTON');
            expect(decrementButton.tagName).toBe('BUTTON');
        });
    });
});
