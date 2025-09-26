#!/usr/bin/env node

/**
 * Coverage validation script
 * Ensures that test coverage meets the required thresholds
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const COVERAGE_FILE = join(process.cwd(), 'coverage', 'coverage-summary.json');
const REQUIRED_COVERAGE = {
  statements: 85,
  branches: 85,
  functions: 85,
  lines: 85,
};

try {
  const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));
  const { total } = coverageData;
  
  console.log('📊 Coverage Summary:');
  console.log(`  Statements: ${total.statements.pct}% (required: ${REQUIRED_COVERAGE.statements}%)`);
  console.log(`  Branches:   ${total.branches.pct}% (required: ${REQUIRED_COVERAGE.branches}%)`);
  console.log(`  Functions:  ${total.functions.pct}% (required: ${REQUIRED_COVERAGE.functions}%)`);
  console.log(`  Lines:      ${total.lines.pct}% (required: ${REQUIRED_COVERAGE.lines}%)`);
  
  const failures = [];
  
  Object.entries(REQUIRED_COVERAGE).forEach(([metric, threshold]) => {
    if (total[metric].pct < threshold) {
      failures.push(`${metric}: ${total[metric].pct}% < ${threshold}%`);
    }
  });
  
  if (failures.length > 0) {
    console.error('\n❌ Coverage validation failed:');
    failures.forEach(failure => console.error(`  - ${failure}`));
    process.exit(1);
  }
  
  console.log('\n✅ All coverage thresholds met!');
  
} catch (error) {
  console.error('❌ Failed to validate coverage:', error.message);
  console.error('Make sure to run tests with coverage first: npm run test:coverage');
  process.exit(1);
}