/**
 * JSON-LD preprocessing utilities
 * Handles various input formats and cleans JSON-LD text before parsing
 * @module utils/parsing/preprocessor
 */

/**
 * Input format detection result
 */
export interface InputFormatDetection {
  /** Whether the input appears to be escaped JSON */
  isEscaped: boolean;

  /** Optional hint to help users understand the format */
  hint?: string;
}

/**
 * Preprocesses JSON string to handle various input formats
 * - Removes BOM characters
 * - Trims whitespace
 * - Removes surrounding backticks and markdown code blocks
 * - Unescapes JSON escape sequences if needed
 *
 * @param input - Raw JSON-LD text from user input
 * @returns Cleaned JSON string ready for parsing
 *
 * @example
 * ```typescript
 * // Remove BOM
 * preprocessJsonInput('\uFEFF{"test":1}') // '{"test":1}'
 *
 * // Remove backticks
 * preprocessJsonInput('`{"test":1}`') // '{"test":1}'
 *
 * // Remove markdown code blocks
 * preprocessJsonInput('```json\n{"test":1}\n```') // '{"test":1}'
 *
 * // Unescape JSON
 * preprocessJsonInput('"{\\n  \\"test\\": 1\\n}"') // '{\n  "test": 1\n}'
 * ```
 */
export function preprocessJsonInput(input: string): string {
  // Remove BOM (Byte Order Mark)
  let processed = input.replace(/^\uFEFF/, '');

  // Trim whitespace
  processed = processed.trim();

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = processed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (codeBlockMatch) {
    processed = codeBlockMatch[1].trim();
  }

  // Remove surrounding backticks (template literal markers)
  if (processed.startsWith('`') && processed.endsWith('`')) {
    processed = processed.slice(1, -1).trim();
  }

  // Remove surrounding quotes if the entire string is wrapped in quotes
  // This handles cases where users copy console.log output with quotes
  if (
    (processed.startsWith('"') && processed.endsWith('"')) ||
    (processed.startsWith("'") && processed.endsWith("'"))
  ) {
    // Check if this is actually a wrapped JSON string vs JSON with string values
    const withoutQuotes = processed.slice(1, -1);

    // Try to detect if this is escaped JSON by looking for literal \n or \"
    if (
      withoutQuotes.includes('\\n') ||
      withoutQuotes.includes('\\"') ||
      withoutQuotes.includes('\\t') ||
      withoutQuotes.includes('\\\\')
    ) {
      processed = withoutQuotes;
    }
  }

  // Unescape JSON escape sequences if present
  // This handles cases where users paste stringified JSON from console
  if (
    processed.includes('\\n') ||
    processed.includes('\\"') ||
    processed.includes('\\t') ||
    processed.includes('\\\\')
  ) {
    try {
      // Use JSON.parse to properly unescape the string
      // Wrap it in quotes to make it a valid JSON string
      processed = JSON.parse(`"${processed}"`);
    } catch {
      // If unescaping fails, return as-is and let the main parser handle it
      return processed;
    }
  }

  return processed;
}

/**
 * Detects if input looks like escaped JSON and provides helpful guidance
 *
 * @param input - Raw JSON-LD text to analyze
 * @returns Detection result with format hints
 *
 * @example
 * ```typescript
 * detectInputFormat('{"test": 1}')
 * // { isEscaped: false }
 *
 * detectInputFormat('"{\\n  \\"test\\": 1\\n}"')
 * // { isEscaped: true, hint: 'It looks like you pasted escaped JSON...' }
 * ```
 */
export function detectInputFormat(input: string): InputFormatDetection {
  const trimmed = input.trim();

  // Check for markdown code blocks
  if (trimmed.match(/^```(?:json)?\s*\n[\s\S]*\n```$/)) {
    return {
      isEscaped: true,
      hint: 'Detected markdown code block. The parser will extract the JSON automatically.',
    };
  }

  // Check for escaped newlines and quotes (common in console output)
  if (trimmed.includes('\\n') && trimmed.includes('\\')) {
    return {
      isEscaped: true,
      hint: 'It looks like you pasted escaped JSON from console output. The parser will try to unescape it automatically.',
    };
  }

  // Check for backticks (template literal)
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return {
      isEscaped: true,
      hint: 'Detected backticks around JSON. The parser will remove them automatically.',
    };
  }

  return { isEscaped: false };
}

/**
 * Validates that preprocessed input is valid JSON
 * Does not throw, returns validation result
 *
 * @param input - Preprocessed JSON string
 * @returns Validation result with parsed data or error details
 *
 * @example
 * ```typescript
 * const result = validateJson('{"test": 1}');
 * if (result.valid) {
 *   console.log(result.data); // { test: 1 }
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateJson(input: string):
  | { valid: true; data: unknown }
  | { valid: false; error: string; line?: number; column?: number } {
  try {
    const data = JSON.parse(input);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Try to extract line and column from error message
      // Example: "Unexpected token } in JSON at position 42"
      const positionMatch = error.message.match(/at position (\d+)/);

      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        // Calculate line and column from position
        const lines = input.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        return {
          valid: false,
          error: error.message,
          line,
          column,
        };
      }

      return {
        valid: false,
        error: error.message,
      };
    }

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown JSON parsing error',
    };
  }
}

/**
 * Checks if input size exceeds maximum allowed size
 *
 * @param input - Input string to check
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns True if input is within size limit
 *
 * @example
 * ```typescript
 * const twoMB = 2 * 1024 * 1024;
 * isWithinSizeLimit('{"test": 1}', twoMB) // true
 * ```
 */
export function isWithinSizeLimit(input: string, maxSizeBytes: number): boolean {
  // Use Blob to get accurate byte size (handles UTF-8 characters)
  const blob = new Blob([input]);
  return blob.size <= maxSizeBytes;
}

/**
 * Get byte size of input string
 *
 * @param input - Input string
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * getByteSize('hello') // 5
 * getByteSize('héllo') // 6 (é is 2 bytes in UTF-8)
 * ```
 */
export function getByteSize(input: string): number {
  const blob = new Blob([input]);
  return blob.size;
}
