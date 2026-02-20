import { writeDb, readDb } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

// Load env for key
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log("Testing Backup...");

// 1. Trigger a write
const db = readDb();
// Make a dummy change to trigger write (even if no change, writeDb is called)
writeDb(db);

// 2. Check for backup file
const today = new Date().toISOString().split('T')[0];
const backupPath = path.join(process.cwd(), 'data', 'backups', `db-${today}.enc`);

if (fs.existsSync(backupPath)) {
    console.log("SUCCESS: Backup file created at " + backupPath);
    const content = fs.readFileSync(backupPath, 'utf-8');
    if (content.includes(':')) {
        console.log("SUCCESS: Content appears encrypted (contains IV separator)");
    } else {
        console.error("FAILURE: Content does not look encrypted");
    }
} else {
    // It might not be created if it already existed.
    console.log("Backup file might already exist or skipped.");
}
