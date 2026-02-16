import dotenv from 'dotenv';
import path from 'path';

console.log("Current working directory:", process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log("Looking for .env at:", envPath);

const result = dotenv.config({ path: envPath });

console.log("Parsed result:", result.parsed);
console.log("Error:", result.error);
console.log("VITE_SUPABASE_URL from process.env:", process.env.VITE_SUPABASE_URL);
