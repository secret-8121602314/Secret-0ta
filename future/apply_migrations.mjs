import pg from 'pg';
import fs from 'fs';

const connectionString = 'postgresql://postgres:biLNCCJgKsj8K09Q@db.qajcxgkqloumogioomiz.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString });

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Run cleanup migration
    const cleanup = fs.readFileSync('supabase/migrations/20251115000000_cleanup_duplicate_game_hubs.sql', 'utf8');
    console.log('\n=== Running cleanup migration ===');
    await client.query(cleanup);
    
    // Run constraint migration
    const constraint = fs.readFileSync('supabase/migrations/20251115000000_fix_game_hub_unique_constraint.sql', 'utf8');
    console.log('\n=== Running constraint migration ===');
    await client.query(constraint);
    
    console.log('\n Migrations applied successfully!');
  } catch (error) {
    console.error(' Migration error:', error.message);
  } finally {
    await client.end();
  }
}

runMigrations();
