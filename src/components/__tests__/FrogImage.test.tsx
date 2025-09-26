import React from 'react';
import {render, screen} from '@testing-library/react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import FrogImage from '../FrogImage';

describe('FrogImage Component', () => {
    beforeEach(() => {
        // Clear any previous mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original Math.random after each test
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            render(<FrogImage/>);
            const frogImageDiv = screen.getByRole('img');
            expect(frogImageDiv).toBeInTheDocument();
        });

        it('should render with correct container id', () => {
            render(<FrogImage/>);
            const frogImageDiv = screen.getByTestId('frog-image');
            expect(frogImageDiv).toBeInTheDocument();
        });

        it('should render image with correct alt text', () => {
            render(<FrogImage/>);
            const image = screen.getByAltText('Frog Here');
            expect(image).toBeInTheDocument();
        });
    });

    describe('Random Image Selection', () => {
        it('should generate index 1 when Math.random returns 0', () => {
            // Mock Math.random to return 0
            vi.spyOn(Math, 'random').mockReturnValue(0);

            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;
            expect(image.src).toContain('imgs/frog_01.png');
        });

        it('should generate index 2 when Math.random returns 0.5', () => {
            // Mock Math.random to return 0.5 (should result in index 2)
            vi.spyOn(Math, 'random').mockReturnValue(0.5);

            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;
            expect(image.src).toContain('imgs/frog_02.png');
        });

        it('should generate index 3 when Math.random returns 0.99', () => {
            // Mock Math.random to return 0.99 (should result in index 3)
            vi.spyOn(Math, 'random').mockReturnValue(0.99);

            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;
            expect(image.src).toContain('imgs/frog_03.png');
        });
    });

    describe('Image Path Generation', () => {
        it('should generate correct image path format', () => {
            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;

            // Should match the pattern imgs/frog_0X.png where X is 1, 2, or 3
            expect(image.src).toMatch(/imgs\/frog_0[1-3]\.png$/);
        });

        it('should use zero-padded format for single digit indices', () => {
            // Test with different random values to ensure zero-padding
            // Math.floor(Math.random() * 3) + 1 calculation:
            // 0.0 - 0.333... -> floor(0-0.999) + 1 = 0 + 1 = 1
            // 0.333... - 0.666... -> floor(1-1.999) + 1 = 1 + 1 = 2  
            // 0.666... - 0.999... -> floor(2-2.999) + 1 = 2 + 1 = 3
            const testCases = [
                {random: 0, expected: 'frog_01.png'},
                {random: 0.32, expected: 'frog_01.png'},
                {random: 0.33, expected: 'frog_01.png'},
                {random: 0.34, expected: 'frog_02.png'},
                {random: 0.65, expected: 'frog_02.png'},
                {random: 0.67, expected: 'frog_03.png'},
                {random: 0.99, expected: 'frog_03.png'}
            ];

            testCases.forEach(({random, expected}) => {
                vi.spyOn(Math, 'random').mockReturnValue(random);
                const {unmount} = render(<FrogImage/>);
                const image = screen.getByRole('img') as HTMLImageElement;
                expect(image.src).toContain(expected);
                unmount();
                vi.restoreAllMocks();
            });
        });
    });

    describe('Index Range Validation', () => {
        it('should always generate index within valid range (1-3)', () => {
            // Test multiple random values to ensure index is always within range
            const testValues = [0, 0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 0.99];

            testValues.forEach((randomValue) => {
                vi.spyOn(Math, 'random').mockReturnValue(randomValue);
                const {unmount} = render(<FrogImage/>);
                const image = screen.getByRole('img') as HTMLImageElement;

                // Extract the index from the src attribute
                const srcMatch = image.src.match(/frog_0(\d)\.png$/);
                expect(srcMatch).toBeTruthy();

                if (!srcMatch) throw new Error('Failed to match frog_0X.png');

                const index = parseInt(srcMatch[1], 10);
                expect(index).toBeGreaterThanOrEqual(1);
                expect(index).toBeLessThanOrEqual(3);


                unmount();
                vi.restoreAllMocks();
            });
        });

        it('should never generate index 0 or negative numbers', () => {
            // Test edge case where Math.random returns 0
            vi.spyOn(Math, 'random').mockReturnValue(0);

            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;

            // Should not contain frog_00.png or any negative index
            expect(image.src).not.toContain('frog_00.png');
            expect(image.src).toContain('frog_01.png');
        });

        it('should never generate index greater than MAX_FROG_IMAGES', () => {
            // Test edge case where Math.random returns close to 1
            vi.spyOn(Math, 'random').mockReturnValue(0.999999);

            render(<FrogImage/>);
            const image = screen.getByRole('img') as HTMLImageElement;

            // Should not contain frog_04.png or higher
            expect(image.src).not.toContain('frog_04.png');
            expect(image.src).toMatch(/frog_0[1-3]\.png$/);
        });
    });

    describe('Component State', () => {
        it('should maintain the same image on re-renders', () => {
            // Mock Math.random to return a specific value
            vi.spyOn(Math, 'random').mockReturnValue(0.5);

            const {rerender} = render(<FrogImage/>);
            const initialImage = screen.getByRole('img') as HTMLImageElement;
            const initialSrc = initialImage.src;

            // Re-render the component
            rerender(<FrogImage/>);
            const rerenderedImage = screen.getByRole('img') as HTMLImageElement;

            // The image source should remain the same because useState preserves the initial value
            expect(rerenderedImage.src).toBe(initialSrc);
        });
    });

    describe('Accessibility', () => {
        it('should have proper alt text for screen readers', () => {
            render(<FrogImage/>);
            const image = screen.getByRole('img');
            expect(image).toHaveAttribute('alt', 'Frog Here');
        });

        it('should be accessible via getByRole', () => {
            render(<FrogImage/>);
            const image = screen.getByRole('img');
            expect(image).toBeInTheDocument();
            expect(image.tagName).toBe('IMG');
        });
    });
});