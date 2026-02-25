import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(process.cwd(), 'db.json');
let dbData = null;
const loadDb = async () => {
    if (dbData) {
        return dbData;
    }
    try {
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbData = JSON.parse(data);
        return dbData;
    }
    catch (error) {
        console.error('Error loading DB file:', error);
        return { queries: [], pages: [], clients: [], client_list: [] };
    }
};
export const fetchConfigFromDb = async (key) => {
    const data = await loadDb();
    return data[key];
};
export const saveConfigToDb = async (key, value) => {
    const data = await loadDb();
    data[key] = value;
    try {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        dbData = data; // Update cache
        return true;
    }
    catch (error) {
        console.error('Error saving to DB file:', error);
        return false;
    }
};
