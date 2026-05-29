import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';

/**
 * Pull Problems Page placeholder.
 * @param {object} context 
 * @returns {Promise<string>} Next page
 */
export default async function run(context) {
  console.clear();
  console.log(pc.cyan(pc.bold("📥 Pull Problems")));
  console.log(pc.gray("This page will allow you to pull LeetCode challenges locally."));
  console.log(pc.dim("─".repeat(50)));
  console.log(pc.yellow("Status: Under Construction 🛠️"));
  console.log(pc.dim("─".repeat(50)));
  console.log();

  const choice = await select({
    message: 'Action:',
    options: [
      { value: 'index', label: '⬅️  Go Back to Main Page' },
      { value: 'exit', label: '🚪 Exit' }
    ]
  });

  if (isCancel(choice)) return 'index';
  return choice;
}
