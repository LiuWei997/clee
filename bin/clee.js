#!/usr/bin/env node
import { outro } from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version safely from package.json
const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

/**
 * Main application router loop.
 */
async function main() {
  const args = process.argv.slice(2);
  let currentPage = 'index';
  
  // If user passed a specific command as CLI argument, load that page directly
  if (args.length > 0) {
    const cmd = args[0].toLowerCase();
    if (['pull', 'push', 'config', 'login'].includes(cmd)) {
      currentPage = cmd;
    }
  }

  const context = {
    version: pkg.version
  };

  // Run the page router loop
  while (currentPage && currentPage !== 'exit') {
    try {
      const modulePath = `../src/pages/${currentPage}.js`;
      const { default: runPage } = await import(modulePath);
      currentPage = await runPage(context);
    } catch (err) {
      console.error(`\nError loading page "${currentPage}":`, err.message);
      currentPage = 'index'; // Fallback to index if error
      
      // Prevent infinite loop if index itself fails
      break;
    }
  }

  outro('Goodbye from CLEE! 🚀');
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
