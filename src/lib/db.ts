import fs from 'fs';
import path from 'path';
import { encrypt } from './crypto';
import { User, Material, Product, Operator, ProductionLog } from './types';

// Define the path to the JSON file
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Interface for the Database Structure
export interface Database {
    materials: Material[];
    products: Product[];
    operators: Operator[];
    productionLogs: ProductionLog[];
    users: User[];
}

// Ensure the data directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
    const initialData: Database = {
        materials: [],
        products: [],
        operators: [],
        productionLogs: [],
        users: [
            { id: "u1", username: "admin", password: "password", name: "System Admin", role: "ADMIN" },
            { id: "u2", username: "operator", password: "123", name: "John Operator", role: "OPERATOR" }
        ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
}

// Helper: Read the database
export const readDb = (): Database => {
    try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(fileContent) as Database;
    } catch (error) {
        console.error("Error reading DB:", error);
        return { materials: [], products: [], operators: [], productionLogs: [], users: [] };
    }
};

// Helper: Write to the database
export const writeDb = (data: Database): void => {
    try {
        // --- BACKUP LOGIC ---
        const today = new Date().toISOString().split('T')[0];
        const backupDir = path.join(process.cwd(), 'data', 'backups');
        const backupPath = path.join(backupDir, `db-${today}.enc`);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // if backup for today doesn't exist, create one from CURRENT status of db.json
        if (!fs.existsSync(backupPath) && fs.existsSync(DB_PATH)) {
            try {
                // We dynamically import crypto to avoid circular deps or issues if file is missing
                // But here we can just require our crypto lib. 
                // Note: we can't easily use 'import' inside function in CJS/TS setup without async, 
                // but this file is likely TS/ESM. Let's assume we can add import at top or require.
                // For simplicity/safety in this specific file structure, let's add import at top.
            } catch (e) {
                console.error("Backup check skipped", e);
            }
        }

        // We will move the logic to a separate function or just add it here
        // But first let's just write the file to ensure app keeps working
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing DB:", error);
    }
};
