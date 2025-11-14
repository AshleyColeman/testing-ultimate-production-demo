#!/usr/bin/env node

/**
 * 🎯 SELECTIVE TEST RUNNER WRAPPER
 *
 * Converts: npx vitest run src/__tests__/selectiveTestRunner.test.ts -- user-actions.test.ts
 * To:      TEST_FILE=user-actions.test.ts npx vitest run src/__tests__/selectiveTestRunner.test.ts
 */

const { spawn } = require('child_process');
const path = require('path');

// Get command line arguments (everything after node test-selective.js)
const args = process.argv.slice(2);

// Find the test file argument (anything ending with .test.ts)
const testFileArgIndex = args.findIndex(arg => arg.endsWith('.test.ts'));

if (testFileArgIndex === -1) {
  console.log('❌ No test file specified.');
  console.log('\n📋 Usage Examples:');
  console.log('   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- user-actions.test.ts');
  console.log('   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- auth-login.test.ts');
  console.log('   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- payment-process.test.ts');

  // List available test files
  try {
    const fs = require('fs');
    const testDir = path.join(process.cwd(), 'src', '__tests__', 'microservices');
    const files = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));
    console.log('\n📁 Available test files in src/__tests__/microservices/:');
    files.forEach(file => console.log(`   • ${file}`));
  } catch (err) {
    console.log('\n📁 Available test files in src/__tests__/microservices/:');
    console.log('   (Unable to list test files)');
  }

  process.exit(1);
}

// Extract the test file
const testFile = args[testFileArgIndex];

// Remove the test file and -- from arguments
const vitestArgs = args.filter((arg, index) => index !== testFileArgIndex && arg !== '--');

// Set environment variable
const env = { ...process.env, TEST_FILE: testFile };

// Run vitest with the environment variable using shell
const vitestCommand = process.platform === 'win32'
  ? `set TEST_FILE=${testFile}&& npx vitest run src/__tests__/selectiveTestRunner.test.ts ${vitestArgs.join(' ')}`
  : `TEST_FILE="${testFile}" npx vitest run src/__tests__/selectiveTestRunner.test.ts ${vitestArgs.join(' ')}`;

const vitestProcess = spawn(vitestCommand, [], {
  env,
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true
});

vitestProcess.on('exit', (code) => {
  process.exit(code);
});