#!/usr/bin/env node
/**
 * Code Quality Checker
 * Scans the codebase for common issues
 * Run: node src/scripts/checkCodeQuality.js
 */

const fs = require('fs');
const path = require('path');

const issues = {
  consoleLogs: [],
  longFiles: [],
  missingErrorHandling: [],
  hardcodedSecrets: [],
  missingValidation: [],
};

let totalFiles = 0;
let totalLines = 0;

/**
 * Scan directory recursively
 */
function scanDirectory(dir, excludeDirs = ['node_modules', 'uploads', 'logs', '.git']) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanDirectory(filePath, excludeDirs);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.test.js') && !file.endsWith('.spec.js')) {
      analyzeFile(filePath);
    }
  });
}

/**
 * Analyze individual file
 */
function analyzeFile(filePath) {
  totalFiles++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  totalLines += lines.length;

  // Check for console.log
  const consoleMatches = content.match(/console\.(log|error|warn|info)/g);
  if (consoleMatches && consoleMatches.length > 0) {
    issues.consoleLogs.push({
      file: filePath,
      count: consoleMatches.length,
    });
  }

  // Check file length
  if (lines.length > 500) {
    issues.longFiles.push({
      file: filePath,
      lines: lines.length,
    });
  }

  // Check for missing try-catch in async functions
  const asyncFunctionMatches = content.match(/async\s+function\s+\w+\s*\([^)]*\)\s*{/g);
  if (asyncFunctionMatches) {
    asyncFunctionMatches.forEach(() => {
      const hasTryCatch = /try\s*{/.test(content);
      if (!hasTryCatch) {
        issues.missingErrorHandling.push(filePath);
      }
    });
  }

  // Check for hardcoded secrets (basic check)
  const secretPatterns = [
    /password\s*=\s*['"][^'"]{3,}['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]{10,}['"]/i,
    /secret\s*=\s*['"][^'"]{10,}['"]/i,
  ];

  secretPatterns.forEach(pattern => {
    if (pattern.test(content) && !filePath.includes('example') && !filePath.includes('test')) {
      if (!issues.hardcodedSecrets.includes(filePath)) {
        issues.hardcodedSecrets.push(filePath);
      }
    }
  });
}

/**
 * Print report
 */
function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CODE QUALITY REPORT');
  console.log('='.repeat(80));
  console.log(`\n📁 Scanned: ${totalFiles} files (${totalLines.toLocaleString()} lines)\n`);

  // Console.log issues
  if (issues.consoleLogs.length > 0) {
    console.log('❌ CONSOLE.LOG STATEMENTS FOUND:');
    console.log(`   ${issues.consoleLogs.length} files contain console statements`);
    issues.consoleLogs.slice(0, 10).forEach(item => {
      console.log(`   - ${item.file.replace(process.cwd(), '.')} (${item.count} occurrences)`);
    });
    if (issues.consoleLogs.length > 10) {
      console.log(`   ... and ${issues.consoleLogs.length - 10} more files`);
    }
    console.log('');
  } else {
    console.log('✅ No console.log statements found\n');
  }

  // Long files
  if (issues.longFiles.length > 0) {
    console.log('⚠️  LARGE FILES (>500 lines):');
    issues.longFiles.forEach(item => {
      console.log(`   - ${item.file.replace(process.cwd(), '.')} (${item.lines} lines)`);
    });
    console.log('   Consider splitting into smaller modules\n');
  } else {
    console.log('✅ No excessively large files\n');
  }

  // Hardcoded secrets
  if (issues.hardcodedSecrets.length > 0) {
    console.log('🚨 POTENTIAL HARDCODED SECRETS:');
    issues.hardcodedSecrets.forEach(file => {
      console.log(`   - ${file.replace(process.cwd(), '.')}`);
    });
    console.log('   Review these files for sensitive data\n');
  } else {
    console.log('✅ No obvious hardcoded secrets\n');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY:');
  console.log(`  Console statements: ${issues.consoleLogs.length} files`);
  console.log(`  Large files: ${issues.longFiles.length} files`);
  console.log(`  Potential secrets: ${issues.hardcodedSecrets.length} files`);
  console.log('='.repeat(80));

  // Exit code
  const hasIssues = issues.consoleLogs.length > 0 || 
                    issues.hardcodedSecrets.length > 0 ||
                    issues.longFiles.length > 5;

  if (hasIssues) {
    console.log('\n⚠️  Code quality issues found. Review and fix before production.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Code quality check passed!\n');
    process.exit(0);
  }
}

// Run the scanner
const srcDir = path.join(__dirname, '..');
scanDirectory(srcDir);
printReport();
