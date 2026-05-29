import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig } from '../utils/config.js';

/**
 * Renders the Index/Opening page of the CLEE CLI tool.
 * @param {object} context - Shared application context containing config, version, etc.
 * @returns {Promise<string>} Next page to load or 'exit'
 */
export default async function run(context) {
  // Clear the console to simulate a clean website-like page load/transition
  console.clear();

  // Retrieve user credentials
  const config = loadConfig();
  const email = config.LEETCODE_EMAIL || null;
  const username = config.LEETCODE_USERNAME || null;

  // Print the CLEE Logo and Metadata (Version/User) side-by-side
  const logoRow0 = pc.cyan(pc.bold("    ____ _     _____ _____ ")) + "  " + pc.dim("│") + "  " + pc.bold("Version: ") + pc.cyan(context.version);
  const logoRow1 = pc.cyan(pc.bold("   / ___| |   | ____| ____|")) + "  " + pc.dim("│") + "  " + pc.bold("User:    ") + (email ? pc.green(email) + (username ? pc.dim(` (${username})`) : '') : pc.yellow('Not Logged In'));
  const logoRow2 = pc.blue(pc.bold("  | |   | |   |  _| |  _|  ")) + "  " + pc.dim("│");
  const logoRow3 = pc.blue(pc.bold("  | |___| |___| |___| |___ ")) + "  " + pc.dim("│");
  const logoRow4 = pc.magenta(pc.bold("   \\____|_____|_____|_____|")) + "  " + pc.dim("│");

  console.log(logoRow0);
  console.log(logoRow1);
  console.log(logoRow2);
  console.log(logoRow3);
  console.log(logoRow4);
  console.log(pc.gray("  LeetCode CLI tool") + " ".repeat(10) + pc.dim("└" + "─".repeat(40)));
  console.log(); // Spacing

  // Menu navigation prompt
  const choice = await select({
    message: 'Navigate to:',
    options: [
      { value: 'pull', label: '📥 Pull Problems', hint: 'Download LeetCode problems locally' },
      { value: 'push', label: '📤 Push Solutions', hint: 'Submit your solution code to LeetCode' },
      { value: 'config', label: '⚙️  Configure Credentials', hint: 'Setup email, session, and CSRF token' },
      { value: 'exit', label: '🚪 Exit', hint: 'Close the application' }
    ]
  });

  if (isCancel(choice)) {
    return 'exit';
  }

  return choice;
}
