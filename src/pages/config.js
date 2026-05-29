import { text, select, isCancel, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';

/**
 * Configure Credentials page.
 * @param {object} context 
 * @returns {Promise<string>} Next page
 */
export default async function run(context) {
  console.clear();
  console.log(pc.magenta(pc.bold("⚙️  Configure Credentials")));
  console.log(pc.gray("Configure your LeetCode authentication tokens and email."));
  console.log(pc.dim("─".repeat(50)));

  const currentConfig = loadConfig();

  // 1. Configure Email
  const email = await text({
    message: "Enter your LeetCode Email (or leave blank to clear):",
    placeholder: "user@example.com",
    defaultValue: currentConfig.LEETCODE_EMAIL || ""
  });

  if (isCancel(email)) return 'index';

  // 2. Configure Session Cookie
  const session = await text({
    message: "Enter LEETCODE_SESSION cookie:",
    placeholder: "eyJ0eXAiOiJKV1QiLC...",
    defaultValue: currentConfig.LEETCODE_SESSION || ""
  });

  if (isCancel(session)) return 'index';

  // 3. Configure CSRF Token
  const csrf = await text({
    message: "Enter csrftoken:",
    placeholder: "a1b2c3d4e5...",
    defaultValue: currentConfig.LEETCODE_CSRF || ""
  });

  if (isCancel(csrf)) return 'index';

  // Save the configuration
  const s = spinner();
  s.start("Saving credentials to .env...");
  
  saveConfig({
    LEETCODE_EMAIL: email.trim(),
    LEETCODE_SESSION: session.trim(),
    LEETCODE_CSRF: csrf.trim()
  });

  s.stop(pc.green("Configuration saved successfully! ✔️"));

  const choice = await select({
    message: 'What would you like to do next?',
    options: [
      { value: 'index', label: '⬅️  Go Back to Main Page' },
      { value: 'exit', label: '🚪 Exit' }
    ]
  });

  if (isCancel(choice)) return 'index';
  return choice;
}
