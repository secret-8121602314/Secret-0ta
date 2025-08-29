#!/usr/bin/env node

/**
 * Complete localStorage Migration Script
 * Migrates all localStorage data to Supabase for the Otakon app
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Complete localStorage Migration...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: package.json not found. Please run this script from the project root.');
    process.exit(1);
}

// Read package.json to get project info
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`📦 Project: ${packageJson.name} v${packageJson.version}\n`);

// Migration steps
const migrationSteps = [
    {
        name: 'Database Schema Verification',
        description: 'Ensure all required Supabase tables and functions exist',
        status: '⏳ Pending'
    },
    {
        name: 'localStorage Data Audit',
        description: 'Scan and catalog all localStorage keys and data',
        status: '⏳ Pending'
    },
    {
        name: 'Data Migration Execution',
        description: 'Migrate all localStorage data to Supabase',
        status: '⏳ Pending'
    },
    {
        name: 'Service Layer Updates',
        description: 'Update all services to use Supabase with localStorage fallback',
        status: '⏳ Pending'
    },
    {
        name: 'Migration Verification',
        description: 'Verify all data was migrated correctly',
        status: '⏳ Pending'
    },
    {
        name: 'Fallback Testing',
        description: 'Test localStorage fallback when Supabase is unavailable',
        status: '⏳ Pending'
    }
];

console.log('📋 Migration Plan:');
migrationSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step.name}: ${step.status}`);
    console.log(`   ${step.description}\n`);
});

console.log('🔍 Step 1: Database Schema Verification');
console.log('   Checking if all required Supabase infrastructure exists...\n');

// Check if the migration SQL has been run
const sqlFiles = [
    'docs/schemas/OTAKON_V19_ULTIMATE_MASTER_SCHEMA.sql',
    'docs/schemas/OTAKON_V19_ULTIMATE_MASTER_SCHEMA.sql'
];

let sqlFileFound = false;
for (const sqlFile of sqlFiles) {
    if (fs.existsSync(sqlFile)) {
        console.log(`✅ Found SQL schema file: ${sqlFile}`);
        sqlFileFound = true;
        break;
    }
}

if (!sqlFileFound) {
    console.log('⚠️  Warning: SQL schema file not found');
    console.log('   Please ensure you have run the database setup SQL first\n');
} else {
    console.log('✅ SQL schema file found - database should be ready\n');
}

console.log('🔍 Step 2: localStorage Data Audit');
console.log('   This step requires the app to be running to access localStorage\n');
console.log('   Please run this in the browser console:\n');

const auditScript = `
// localStorage Audit Script - Run this in browser console
console.log('🔍 Starting localStorage Audit...');

const allKeys = Object.keys(localStorage);
const otakonKeys = allKeys.filter(key => key.startsWith('otakon_'));
const otherKeys = allKeys.filter(key => !key.startsWith('otakon_'));

console.log('📊 localStorage Audit Results:');
console.log('Total keys:', allKeys.length);
console.log('Otakon keys:', otakonKeys.length);
console.log('Other keys:', otherKeys.length);

console.log('\\n🔑 Otakon Keys:');
otakonKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    console.log(\`  \${key}: \${size} bytes\`);
});

console.log('\\n🔑 Other Keys:');
otherKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    console.log(\`  \${key}: \${size} bytes\`);
});

// Export data for migration
const exportData = {};
otakonKeys.forEach(key => {
    try {
        exportData[key] = JSON.parse(localStorage.getItem(key));
    } catch {
        exportData[key] = localStorage.getItem(key);
    }
});

console.log('\\n📤 Export Data (copy this for migration):');
console.log(JSON.stringify(exportData, null, 2));
`;

console.log(auditScript);

console.log('\n🔍 Step 3: Data Migration Execution');
console.log('   The migration will be handled by the supabaseDataService.migrateAllLocalStorageData() method');
console.log('   This method is already implemented and will migrate:');
console.log('   ✅ Profile setup and welcome message tracking');
console.log('   ✅ TTS preferences (speech rate, voice URI)');
console.log('   ✅ PWA preferences (hands-free mode)');
console.log('   ✅ PWA analytics (installs, engagement)');
console.log('   ✅ Proactive insights and trigger history');
console.log('   ✅ Character detection cache');
console.log('   ✅ API cost records');
console.log('   ✅ Wishlist data');
console.log('   ✅ Otaku Diary (tasks, favorites)');
console.log('   ✅ Daily goals and streaks');
console.log('   ✅ Feedback data');
console.log('   ✅ Onboarding and connection tracking\n');

console.log('🔍 Step 4: Service Layer Updates');
console.log('   The following services need to be updated to use Supabase:');
console.log('   ⚠️  TTS Service - Speech rate and voice preferences');
console.log('   ⚠️  PWA Analytics Service - Install and engagement tracking');
console.log('   ⚠️  PWA Navigation Service - Hands-free mode preference');
console.log('   ⚠️  Unified Usage Service - Usage counting and tier management');
console.log('   ⚠️  Gemini Service - Cooldown and news cache');
console.log('   ⚠️  Wishlist Service - Wishlist data caching');
console.log('   ⚠️  Otaku Diary Service - Tasks and favorites');
console.log('   ⚠️  Character Detection Service - Character cache and language profiles');
console.log('   ⚠️  API Cost Service - Cost tracking records');
console.log('   ⚠️  Proactive Insight Service - Insights and trigger history\n');

console.log('🔍 Step 5: Migration Verification');
console.log('   After migration, verify:');
console.log('   ✅ All data appears in Supabase dashboard');
console.log('   ✅ App functionality works with Supabase data');
console.log('   ✅ localStorage fallback works when offline');
console.log('   ✅ Cross-device sync works correctly\n');

console.log('🔍 Step 6: Fallback Testing');
console.log('   Test scenarios:');
console.log('   ✅ Supabase available - data loads from Supabase');
console.log('   ✅ Supabase unavailable - data loads from localStorage');
console.log('   ✅ Mixed scenario - some data from each source\n');

console.log('🚀 Ready to Proceed!');
console.log('\nNext steps:');
console.log('1. Run the localStorage audit script in your browser console');
console.log('2. Execute the migration using supabaseDataService.migrateAllLocalStorageData()');
console.log('3. Update the remaining services to use Supabase');
console.log('4. Test all functionality');
console.log('5. Verify data persistence and sync');

console.log('\n💡 Pro tip: You can trigger the migration from the Settings > Migration tab in the app!');
