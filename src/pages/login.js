import { select, text, isCancel, spinner, note } from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';
import { loadConfig, saveConfig } from '../utils/config.js';
import { findChromeCookieFiles, getChromeSafeStorageKey, extractLeetCodeCookies } from '../utils/chromeCookie.js';
import { checkLeetcodeSession } from '../utils/leetcodeApi.js';

/**
 * CLI login page flow.
 * @param {object} context 
 * @returns {Promise<string>} Next page
 */
export default async function run(context) {
  console.clear();
  console.log(pc.cyan(pc.bold("🔑 LeetCode Login Wizard")));
  console.log(pc.gray("Link your LeetCode account to download problems and submit solutions."));
  console.log(pc.dim("─".repeat(55)));

  // 1. Select Domain
  const domain = await select({
    message: 'Select LeetCode Domain:',
    options: [
      {value: 'leetcode.com', label: '🌐 leetcode.com (Global)', hint: 'Standard US website'},
      {value: 'leetcode.cn', label: '🇨🇳 leetcode.cn (China)', hint: 'Standard China website'}
    ]
  });

  if (isCancel(domain)) return 'index';

  // 2. Open Login URL in Browser
  const loginUrl = `https://${domain}/accounts/login/`;
  const openSpinner = spinner();
  openSpinner.start(`Opening browser login page...`);

  try {
    execSync(`open "${loginUrl}"`);
    openSpinner.stop(pc.green(`Browser opened! Please log in to your LeetCode account.`));
  } catch (err) {
    openSpinner.stop(pc.yellow(`Failed to open browser automatically. Please open: ${loginUrl}`));
  }
}
