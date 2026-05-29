import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');

// Initialize dotenv to parse process.env automatically
dotenv.config();

/**
 * Loads the current environment configuration.
 * @returns {Record<string, string>}
 */
export function loadConfig() {
  if (fs.existsSync(envPath)) {
    try {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      return envConfig;
    } catch (e) {
      console.error('Error parsing .env file:', e);
      return {};
    }
  }
  return {};
}

/**
 * Saves or updates environment configuration variables.
 * @param {Record<string, string>} configUpdates 
 */
export function saveConfig(configUpdates) {
  const currentConfig = loadConfig();
  const mergedConfig = { ...currentConfig, ...configUpdates };
  
  const envContent = Object.entries(mergedConfig)
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');
    
  fs.writeFileSync(envPath, envContent + '\n', 'utf8');
}
