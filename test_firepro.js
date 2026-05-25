const fs = require('fs');
const path = require('path');

// Load and parse the JSON file
const firepro = JSON.parse(fs.readFileSync(path.join(__dirname, 'firepro.json'), 'utf8'));

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

console.log('🧪 Starting firepro.json validation tests...\n');

// Test 1: Valid JSON structure
console.log('✓ Test 1: JSON structure is valid');
tests.passed++;

// Test 2: Check for required fields
console.log('✓ Test 2: Root object contains "2636" key');
if (!firepro['2636']) {
  tests.failed++;
  tests.errors.push('Missing "2636" key in root object');
} else {
  tests.passed++;
}

// Test 3: Entries is an array
console.log('✓ Test 3: "2636" value is an array');
if (!Array.isArray(firepro['2636'])) {
  tests.failed++;
  tests.errors.push('"2636" is not an array');
} else {
  tests.passed++;
}

const entries = firepro['2636'];
console.log(`\n📦 Found ${entries.length} entries\n`);

// Test 4-7: Validate each entry structure
let structureErrors = 0;
entries.forEach((entry, index) => {
  const requiredFields = ['name', 'package', 'url', 'icon', 'desc'];
  const missing = requiredFields.filter(field => !(field in entry));
  
  if (missing.length > 0) {
    structureErrors++;
    tests.errors.push(`Entry ${index + 1} (${entry.name || 'UNKNOWN'}) missing fields: ${missing.join(', ')}`);
  }
});

if (structureErrors === 0) {
  console.log('✓ Test 4: All entries have required fields (name, package, url, icon, desc)');
  tests.passed++;
} else {
  console.log(`✗ Test 4: ${structureErrors} entries have missing fields`);
  tests.failed += structureErrors;
}

// Test 5: URL validation - no double protocols
console.log('✓ Test 5: Checking for malformed URLs...');
let urlErrors = 0;
const urlIssues = [];

entries.forEach((entry, index) => {
  // Check for double https://
  if (entry.url.includes('https://https://') || entry.url.includes('http://http://')) {
    urlErrors++;
    urlIssues.push(`Entry ${index + 1} (${entry.name}): Double protocol detected`);
  }
  
  // Check URL starts with http or https
  if (!entry.url.startsWith('http://') && !entry.url.startsWith('https://')) {
    urlErrors++;
    urlIssues.push(`Entry ${index + 1} (${entry.name}): URL doesn't start with http/https`);
  }
  
  // Check icon URL
  if (!entry.icon.startsWith('http://') && !entry.icon.startsWith('https://')) {
    urlErrors++;
    urlIssues.push(`Entry ${index + 1} (${entry.name}): Icon URL doesn't start with http/https`);
  }
});

if (urlErrors === 0) {
  console.log('  ✓ All URLs properly formatted (no double protocols)');
  tests.passed++;
} else {
  console.log(`  ✗ ${urlErrors} URL issues found:`);
  urlIssues.forEach(issue => console.log(`    - ${issue}`));
  tests.failed += urlErrors;
}

// Test 6: Package names validation
console.log('✓ Test 6: Validating package names...');
let packageErrors = 0;
const packageIssues = [];

entries.forEach((entry, index) => {
  // Package names should match Android convention (dot-separated, lowercase)
  if (!/^[a-z0-9_.]+$/.test(entry.package)) {
    packageErrors++;
    packageIssues.push(`Entry ${index + 1} (${entry.name}): Invalid package format "${entry.package}"`);
  }
});

if (packageErrors === 0) {
  console.log('  ✓ All package names follow Android naming conventions');
  tests.passed++;
} else {
  console.log(`  ✗ ${packageErrors} package name issues found:`);
  packageIssues.forEach(issue => console.log(`    - ${issue}`));
  tests.failed += packageErrors;
}

// Test 7: Unique package names
console.log('✓ Test 7: Checking for duplicate package names...');
const packages = entries.map(e => e.package);
const duplicates = packages.filter((pkg, index) => packages.indexOf(pkg) !== index);
const uniqueDuplicates = [...new Set(duplicates)];

if (uniqueDuplicates.length === 0) {
  console.log('  ✓ All package names are unique');
  tests.passed++;
} else {
  console.log(`  ✗ ${uniqueDuplicates.length} duplicate package(s) found:`);
  uniqueDuplicates.forEach(pkg => {
    const dups = entries.filter(e => e.package === pkg);
    console.log(`    - "${pkg}" appears ${dups.length} times (${dups.map(d => d.name).join(', ')})`);
  });
  tests.failed += uniqueDuplicates.length;
}

// Test 8: Validate specific new entries
console.log('✓ Test 8: Validating new entries...');
const newEntries = ['UnLinked', 'Downloader'];
let newEntryErrors = 0;

newEntries.forEach(name => {
  const entry = entries.find(e => e.name === name);
  if (!entry) {
    newEntryErrors++;
    tests.errors.push(`New entry "${name}" not found`);
  } else {
    console.log(`  ✓ Found "${name}" (package: ${entry.package})`);
  }
});

if (newEntryErrors === 0) {
  tests.passed++;
} else {
  tests.failed += newEntryErrors;
}

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:
  ✓ Passed: ${tests.passed}
  ✗ Failed: ${tests.failed}
  Total:   ${tests.passed + tests.failed}\n`);

if (tests.errors.length > 0) {
  console.log('❌ Errors found:');
  tests.errors.forEach(error => console.log(`  - ${error}`));
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
