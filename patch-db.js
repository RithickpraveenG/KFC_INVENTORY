import fs from 'fs';
import path from 'path';
import { readDb, writeDb } from './src/lib/db';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

if (fs.existsSync(DB_PATH)) {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (!data.users) {
        data.users = [
            { id: "u1", username: "admin", "password": "password", name: "System Admin", role: "ADMIN" },
            { id: "u2", username: "operator", "password": "123", name: "John Operator", role: "OPERATOR" }
        ];
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        console.log("Patched db.json with default users.");
    } else {
        console.log("db.json already has users.");
    }
} else {
    console.log("db.json not found.");
}
