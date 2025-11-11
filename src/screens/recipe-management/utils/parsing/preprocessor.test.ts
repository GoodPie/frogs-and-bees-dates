/**
 * Unit tests for JSON-LD preprocessor
 * Tests BOM removal, wrapping, escaping, and format detection
 * @module utils/parsing/preprocessor.test
 */

import { describe, it, expect } from 'vitest';
import {
  preprocessJsonInput,
  detectInputFormat,
  validateJson,
  isWithinSizeLimit,
  getByteSize,
} from './preprocessor';

describe('preprocessJsonInput', () => {
  describe('BOM handling', () => {
    it('should remove BOM characters from start', () => {
      const input = '\uFEFF{"test":1}';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });

    it('should handle input without BOM', () => {
      const input = '{"test":1}';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });
  });

  describe('Whitespace handling', () => {
    it('should trim leading and trailing whitespace', () => {
      const input = '  \n\t{"test":1}  \n\t';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });

    it('should preserve internal whitespace', () => {
      const input = '{"test": 1, "nested": {"key": "value"}}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"test": 1');
    });
  });

  describe('Markdown code block handling', () => {
    it('should remove json code blocks', () => {
      const input = '```json\n{"test":1}\n```';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });

    it('should remove generic code blocks', () => {
      const input = '```\n{"test":1}\n```';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });

    it('should handle multiline JSON in code blocks', () => {
      const input = '```json\n{\n  "test": 1,\n  "nested": {\n    "key": 2\n  }\n}\n```';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"test": 1');
      expect(result).toContain('"nested"');
    });
  });

  describe('Backtick handling', () => {
    it('should remove surrounding backticks', () => {
      const input = '`{"test":1}`';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":1}');
    });

    it('should not remove internal backticks', () => {
      const input = '{"test":"value with `backticks`"}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('`backticks`');
    });
  });

  describe('Quote wrapping handling', () => {
    it('should remove wrapping double quotes from escaped JSON', () => {
      const input = '"{\\n  \\"test\\": 1\\n}"';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"test": 1');
    });

    it('should not remove quotes from valid JSON strings', () => {
      const input = '{"test":"value"}';
      const result = preprocessJsonInput(input);
      expect(result).toBe('{"test":"value"}');
    });

    it('should handle single-quote wrapping', () => {
      const input = '\'{\\n  \\"test\\": 1\\n}\'';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"test": 1');
    });
  });

  describe('Escape sequence handling', () => {
    it('should unescape newlines', () => {
      const input = '{\\n  \\"test\\": 1\\n}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('\n');
    });

    it('should unescape quotes', () => {
      const input = '{\\"test\\": 1}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"test"');
    });

    it('should unescape tabs', () => {
      const input = '{\\t\\"test\\": 1}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('\t');
    });

    it('should unescape backslashes', () => {
      const input = '{\\"path\\": \\"C:\\\\\\\\Users\\\\\\\\test\\"}';
      const result = preprocessJsonInput(input);
      expect(result).toContain('C:\\\\Users\\\\test');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle BOM + code block + escaping', () => {
      const input = '\uFEFF```json\n{\\n  \\"test\\": 1\\n}\n```';
      const result = preprocessJsonInput(input);
      // Should remove BOM, extract from code block, and unescape
      expect(result).toContain('"test": 1');
    });

    it('should handle real-world console output', () => {
      const input = '"{\\n  \\"@type\\": \\"Recipe\\",\\n  \\"name\\": \\"Test Recipe\\"\\n}"';
      const result = preprocessJsonInput(input);
      expect(result).toContain('"@type": "Recipe"');
      expect(result).toContain('"name": "Test Recipe"');
    });

    it('should not corrupt valid JSON', () => {
      const validJson = '{"@type":"Recipe","name":"Test","ingredients":["1 cup flour","salt"]}';
      const result = preprocessJsonInput(validJson);
      expect(result).toBe(validJson);
    });
  });
});

describe('detectInputFormat', () => {
  it('should detect markdown code blocks', () => {
    const input = '```json\n{"test":1}\n```';
    const result = detectInputFormat(input);
    expect(result.isEscaped).toBe(true);
    expect(result.hint).toContain('markdown');
  });

  it('should detect escaped JSON from console', () => {
    const input = '{\\n  \\"test\\": 1\\n}';
    const result = detectInputFormat(input);
    expect(result.isEscaped).toBe(true);
    expect(result.hint).toContain('console output');
  });

  it('should detect backtick wrapping', () => {
    const input = '`{"test":1}`';
    const result = detectInputFormat(input);
    expect(result.isEscaped).toBe(true);
    expect(result.hint).toContain('backticks');
  });

  it('should not detect escaping in normal JSON', () => {
    const input = '{"test":1}';
    const result = detectInputFormat(input);
    expect(result.isEscaped).toBe(false);
    expect(result.hint).toBeUndefined();
  });
});

describe('validateJson', () => {
  it('should validate correct JSON', () => {
    const input = '{"test":1}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({ test: 1 });
    }
  });

  it('should detect invalid JSON', () => {
    const input = '{test:1}'; // Missing quotes
    const result = validateJson(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBeTruthy();
    }
  });

  it('should detect trailing commas', () => {
    const input = '{"test":1,}';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
  });

  it('should detect unmatched brackets', () => {
    const input = '{"test":1';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
  });

  it('should provide line/column info when available', () => {
    const input = '{\n  "test": 1,\n  "invalid": \n}';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBeTruthy();
      // May have line/column info depending on parser
    }
  });

  it('should handle complex nested JSON', () => {
    const input = '{"a":{"b":{"c":{"d":1}}}}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
  });

  it('should handle arrays', () => {
    const input = '{"items":[1,2,3]}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({ items: [1, 2, 3] });
    }
  });
});

describe('isWithinSizeLimit', () => {
  it('should accept input within limit', () => {
    const input = '{"test":1}';
    const result = isWithinSizeLimit(input, 1024);
    expect(result).toBe(true);
  });

  it('should reject input exceeding limit', () => {
    const largeInput = 'x'.repeat(1000);
    const result = isWithinSizeLimit(largeInput, 100);
    expect(result).toBe(false);
  });

  it('should handle UTF-8 characters correctly', () => {
    const input = '{"emoji":"🍕"}'; // Multi-byte characters
    const byteSize = getByteSize(input);
    const result = isWithinSizeLimit(input, byteSize);
    expect(result).toBe(true);
  });

  it('should handle exact limit boundary', () => {
    const input = '{"test":1}';
    const exactSize = getByteSize(input);
    expect(isWithinSizeLimit(input, exactSize)).toBe(true);
    expect(isWithinSizeLimit(input, exactSize - 1)).toBe(false);
  });
});

describe('getByteSize', () => {
  it('should calculate ASCII string size', () => {
    const input = 'hello';
    expect(getByteSize(input)).toBe(5);
  });

  it('should handle empty string', () => {
    expect(getByteSize('')).toBe(0);
  });

  it('should calculate UTF-8 multibyte character size', () => {
    const input = 'héllo'; // é is 2 bytes in UTF-8
    expect(getByteSize(input)).toBe(6);
  });

  it('should handle emoji correctly', () => {
    const input = '🍕'; // Pizza emoji is 4 bytes
    expect(getByteSize(input)).toBeGreaterThan(1);
  });

  it('should calculate JSON byte size', () => {
    const input = '{"test":1}'; // 10 characters
    expect(getByteSize(input)).toBe(10);
  });
});
