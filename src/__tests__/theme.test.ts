import { describe, it, expect } from 'vitest';
import { system } from '../theme';

describe('theme configuration', () => {
  it('should export a system object', () => {
    expect(system).toBeDefined();
    expect(typeof system).toBe('object');
  });

  it('should be a valid Chakra UI system', () => {
    expect(system).toHaveProperty('$$chakra');
    expect(system.$$chakra).toBe(true);
  });

  it('should have required Chakra UI system properties', () => {
    // Test that the system has the basic properties we expect from createSystem
    expect(system).toHaveProperty('token');
    expect(typeof system.token).toBe('function');
  });

  it('should be created with custom theme configuration', () => {
    // Since we can't easily access the internal config, we test that the system
    // was created successfully and has the expected structure
    expect(system).toBeDefined();
    expect(system.$$chakra).toBe(true);
    
    // The system should have token function for accessing theme values
    expect(typeof system.token).toBe('function');
  });

  it('should allow token access for fonts', () => {
    // Test that we can access font tokens through the system
    // This verifies our theme configuration is working
    expect(() => system.token('fonts.heading')).not.toThrow();
    expect(() => system.token('fonts.body')).not.toThrow();
  });

  it('should have consistent font configuration', () => {
    // Test that both heading and body fonts are configured
    const headingFont = system.token('fonts.heading');
    const bodyFont = system.token('fonts.body');
    
    expect(headingFont).toBeDefined();
    expect(bodyFont).toBeDefined();
    expect(headingFont).toBe(bodyFont); // Should be the same Figtree font
  });

  it('should use Figtree font family', () => {
    const headingFont = system.token('fonts.heading');
    
    expect(headingFont).toContain('Figtree');
    expect(headingFont).toContain('sans-serif');
  });
});