#!/usr/bin/env node

import { intro, outro, select, text, spinner, confirm, note, isCancel } from '@clack/prompts';
import color from 'picocolors';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig, clearConfig } from '../src/config.js';
import { searchProblem, getProblemDetails, submitSolution, checkSubmissionStatus } from '../src/api.js';
import { htmlToMarkdown, getExtensionForLang, getLangSlugFromPath, formatDifficulty, LANGUAGE_MAP } from '../src/utils.js';

// Setup environment loading
import dotenv from 'dotenv';
dotenv.config();

function showHelp() {
  console.log(`
${color.bgCyan(color.black('  CLEE - LeetCode CLI  '))}

${color.bold('Usage:')}
  $ clee                  ${color.dim('# Run interactively (recommended)')}
  $ clee pull <slug-or-id> ${color.dim('# Fetch a problem directly')}
  $ clee push <file-path>  ${color.dim('# Submit a solution directly')}
  $ clee config           ${color.dim('# Configure credentials directly')}
  $ clee -h, --help       ${color.dim('# Show this help message')}

${color.bold('Authentication:')}
  To submit solutions, you must configure your cookies.
  1. Open leetcode.com in your browser and log in.
  2. Open Developer Tools (F12) > Application > Cookies.
  3. Copy the values of 'LEETCODE_SESSION' and 'csrftoken'.
  4. Run 'clee' and select 'Configure credentials' to paste them.
`);
}

function printSubmissionResult(result) {
  const isAccepted = result.status_msg === 'Accepted';

  if (isAccepted) {
    const runtimePct = typeof result.runtime_percentile === 'number' ? result.runtime_percentile.toFixed(2) : 'N/A';
    const memoryPct = typeof result.memory_percentile === 'number' ? result.memory_percentile.toFixed(2) : 'N/A';
    
    note(
      `${color.green(color.bold('✔ ACCEPTED'))}\n\n` +
      `  • Runtime: ${color.cyan(result.status_runtime || 'N/A')} (beats ${color.green(runtimePct + '%')} of users)\n` +
      `  • Memory: ${color.cyan(result.status_memory || 'N/A')} (beats ${color.green(memoryPct + '%')} of users)\n` +
      `  • Testcases: ${color.cyan(`${result.total_correct}/${result.total_testcases}`)}`,
      'Submission Result'
    );
  } else {
    let errorDetail = '';
    
    if (result.compile_error) {
      errorDetail = `\n${color.red(color.bold('Compile Error:'))}\n${result.compile_error}`;
    } else if (result.full_runtime_error) {
      errorDetail = `\n${color.red(color.bold('Runtime Error:'))}\n${result.full_runtime_error}`;
    } else if (result.last_testcase) {
      errorDetail = `\n` +
        `  • Last Input: ${color.yellow(result.last_testcase.trim())}\n` +
        `  • Your Output: ${color.red(result.code_output?.trim() || 'No output')}\n` +
        `  • Expected: ${color.green(result.expected_output?.trim() || 'No output')}`;
    }

    note(
      `${color.red(color.bold(`✘ ${result.status_msg?.toUpperCase() || 'FAILED'}`))}\n` +
      `  • Testcases passed: ${color.cyan(`${result.total_correct || 0}/${result.total_testcases || 0}`)}` +
      errorDetail,
      'Submission Result'
    );
  }
}

async function configCommand() {
  const current = loadConfig();
  
  const action = await select({
    message: 'Configure LeetCode credentials:',
    options: [
      { value: 'set', label: '🔑 Set or Update credentials' },
      { value: 'view', label: '👁️ View current credentials' },
      { value: 'clear', label: '🗑️ Clear credentials' },
      { value: 'back', label: '⬅️ Back to main menu' },
    ]
  });

  if (isCancel(action) || action === 'back') return;

  if (action === 'view') {
    note(
      `Domain: ${current.domain}\n` +
      `LEETCODE_SESSION: ${current.LEETCODE_SESSION ? '••••••••' + current.LEETCODE_SESSION.slice(-6) : '(Not set)'}\n` +
      `csrftoken: ${current.csrftoken ? '••••••••' + current.csrftoken.slice(-6) : '(Not set)'}`,
      'Current Configuration'
    );
    return;
  }

  if (action === 'clear') {
    const confirmClear = await confirm({
      message: 'Are you sure you want to clear your credentials?',
      initialValue: false
    });
    if (confirmClear && !isCancel(confirmClear)) {
      clearConfig();
      note('Credentials cleared successfully.', 'Configuration');
    }
    return;
  }

  if (action === 'set') {
    const domain = await select({
      message: 'Select LeetCode domain:',
      options: [
        { value: 'leetcode.com', label: 'leetcode.com (Global)' },
        { value: 'leetcode.cn', label: 'leetcode.cn (China)' },
      ],
      initialValue: current.domain
    });
    if (isCancel(domain)) return;

    const session = await text({
      message: 'Enter your LEETCODE_SESSION cookie:',
      placeholder: 'Paste the cookie value...',
      initialValue: current.LEETCODE_SESSION || '',
      validate(val) {
        if (!val.trim()) return 'Session token cannot be empty.';
      }
    });
    if (isCancel(session)) return;

    const csrf = await text({
      message: 'Enter your csrftoken cookie:',
      placeholder: 'Paste the token value...',
      initialValue: current.csrftoken || '',
      validate(val) {
        if (!val.trim()) return 'CSRF token cannot be empty.';
      }
    });
    if (isCancel(csrf)) return;

    saveConfig({
      domain,
      LEETCODE_SESSION: session.trim(),
      csrftoken: csrf.trim()
    });

    note(
      'Credentials saved successfully!\n' +
      `Domain: ${domain}\n` +
      'You are ready to submit solutions now.',
      'Configuration Success'
    );
  }
}

async function pullCommand(searchArg) {
  let searchTerm = searchArg;
  if (!searchTerm) {
    searchTerm = await text({
      message: 'Enter LeetCode problem ID, name, or slug (e.g. 1, two-sum):',
      placeholder: 'two-sum',
      validate(value) {
        if (!value.trim()) return 'Please enter a search term.';
      }
    });
    if (isCancel(searchTerm)) return;
  }

  const s = spinner();
  s.start('Searching LeetCode...');
  const results = await searchProblem(searchTerm.trim());
  s.stop('Search completed');

  if (results.length === 0) {
    note(color.yellow('No problems matched your search.'), 'Search Results');
    return;
  }

  let selectedProblem;
  if (results.length === 1) {
    selectedProblem = results[0];
  } else {
    // Filter matching ID first if numeric
    const exactNumMatch = /^\d+$/.test(searchTerm) && results.find(q => q.frontendQuestionId === searchTerm.trim());
    if (exactNumMatch) {
      selectedProblem = exactNumMatch;
    } else {
      selectedProblem = await select({
        message: 'Select a problem:',
        options: results.map(q => ({
          value: q,
          label: `#${q.frontendQuestionId} - ${q.title} (${q.difficulty})`
        }))
      });
      if (isCancel(selectedProblem)) return;
    }
  }

  s.start(`Fetching details for "${selectedProblem.title}"...`);
  const details = await getProblemDetails(selectedProblem.titleSlug);
  s.stop('Fetched problem details');

  const snippets = details.codeSnippets || [];
  const langChoices = snippets
    .filter(snip => LANGUAGE_MAP[snip.langSlug])
    .map(snip => ({
      value: snip,
      label: LANGUAGE_MAP[snip.langSlug].name
    }));

  if (langChoices.length === 0) {
    note(color.red('No supported language snippets available for this problem.'), 'Error');
    return;
  }

  const selectedSnippet = await select({
    message: 'Select your programming language:',
    options: langChoices
  });
  if (isCancel(selectedSnippet)) return;

  const problemDirName = `${details.questionFrontendId}-${details.titleSlug}`;
  const problemDir = path.join(process.cwd(), 'problems', problemDirName);
  fs.mkdirSync(problemDir, { recursive: true });

  const ext = getExtensionForLang(selectedSnippet.langSlug);
  const solutionFile = path.join(problemDir, `solution.${ext}`);
  const readmeFile = path.join(problemDir, 'README.md');

  // Write README
  const readmeContent = `# [${details.questionFrontendId}. ${details.title}](https://leetcode.com/problems/${details.titleSlug}/)

**Difficulty:** ${formatDifficulty(details.difficulty)}

## Description

${htmlToMarkdown(details.content)}
`;
  fs.writeFileSync(readmeFile, readmeContent, 'utf8');

  // Write solution template
  let writeSolution = true;
  if (fs.existsSync(solutionFile)) {
    const overwrite = await confirm({
      message: `solution.${ext} already exists. Overwrite?`,
      initialValue: false
    });
    if (isCancel(overwrite) || !overwrite) {
      writeSolution = false;
    }
  }

  if (writeSolution) {
    fs.writeFileSync(solutionFile, selectedSnippet.code, 'utf8');
  }

  note(
    `Problem directory: problems/${problemDirName}\n` +
    `Description: ${path.relative(process.cwd(), readmeFile)}\n` +
    `Starter Code: ${path.relative(process.cwd(), solutionFile)}`,
    'Successfully Pulled!'
  );
}

async function pushCommand(fileArg) {
  let solutionFilePath = fileArg;
  if (!solutionFilePath) {
    const problemsPath = path.join(process.cwd(), 'problems');
    if (!fs.existsSync(problemsPath)) {
      note(color.yellow('No local problems directory found. Pull a problem first!'), 'Push');
      return;
    }

    const dirs = fs.readdirSync(problemsPath).filter(name => {
      const fullPath = path.join(problemsPath, name);
      return fs.statSync(fullPath).isDirectory() && /^\d+-/.test(name);
    });

    if (dirs.length === 0) {
      note(color.yellow('No problems found in the problems/ directory.'), 'Push');
      return;
    }

    const chosenDir = await select({
      message: 'Select a problem to submit:',
      options: dirs.map(d => ({ value: d, label: d }))
    });
    if (isCancel(chosenDir)) return;

    const dirPath = path.join(problemsPath, chosenDir);
    const files = fs.readdirSync(dirPath).filter(file => {
      const slug = getLangSlugFromPath(file);
      return slug !== null;
    });

    if (files.length === 0) {
      note(color.red(`No valid solution files found in problems/${chosenDir}.`), 'Error');
      return;
    }

    let selectedFile;
    if (files.length === 1) {
      selectedFile = files[0];
    } else {
      selectedFile = await select({
        message: 'Select the solution file to submit:',
        options: files.map(f => ({ value: f, label: f }))
      });
      if (isCancel(selectedFile)) return;
    }

    solutionFilePath = path.join(dirPath, selectedFile);
  } else {
    solutionFilePath = path.resolve(process.cwd(), solutionFilePath);
    if (!fs.existsSync(solutionFilePath)) {
      throw new Error(`File does not exist: ${solutionFilePath}`);
    }
  }

  // Parse details
  const folderName = path.basename(path.dirname(solutionFilePath));
  const match = folderName.match(/^(\d+)-([a-zA-Z0-9-]+)$/);
  if (!match) {
    throw new Error(`Could not parse LeetCode problem slug from directory name: "${folderName}". Expected format: "<id>-<slug>" (e.g. "1-two-sum")`);
  }
  const titleSlug = match[2];
  const langSlug = getLangSlugFromPath(solutionFilePath);
  if (!langSlug) {
    throw new Error(`Unsupported file extension: "${path.extname(solutionFilePath)}"`);
  }

  const code = fs.readFileSync(solutionFilePath, 'utf8');

  const s = spinner();
  s.start(`Fetching details for "${titleSlug}"...`);
  const details = await getProblemDetails(titleSlug);
  const questionId = details.questionId;
  s.stop('Fetched question details');

  s.start('Submitting solution to LeetCode...');
  const submissionId = await submitSolution(titleSlug, questionId, langSlug, code);
  s.stop(`Submitted! ID: ${submissionId}`);

  s.start('Waiting for LeetCode to judge your submission...');
  let result;
  let attempts = 0;
  while (attempts < 15) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    result = await checkSubmissionStatus(submissionId, titleSlug);
    if (result.state === 'SUCCESS') {
      break;
    }
    attempts++;
  }

  if (!result || result.state !== 'SUCCESS') {
    s.stop('Timeout waiting for result');
    throw new Error('LeetCode execution took too long or failed to respond.');
  }
  s.stop('Judged!');

  printSubmissionResult(result);
}

async function interactiveMenu() {
  intro(color.bgCyan(color.black('  CLEE - LeetCode CLI  ')));

  const config = loadConfig();
  if (!config.LEETCODE_SESSION || !config.csrftoken) {
    note(
      color.yellow('No LeetCode credentials found!\n') +
      'You can still search and pull problems, but you won\'t be able to push/submit solutions.\n' +
      'Run "Configure credentials" to set them up.',
      'Configuration Warning'
    );
  }

  while (true) {
    const choice = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'pull', label: '📥 Pull a problem' },
        { value: 'push', label: '📤 Push a solution' },
        { value: 'config', label: '⚙️ Configure credentials' },
        { value: 'exit', label: '❌ Exit' },
      ],
    });

    if (isCancel(choice) || choice === 'exit') {
      outro(color.cyan('Happy coding! See you next time.'));
      process.exit(0);
    }

    try {
      if (choice === 'pull') {
        await pullCommand();
      } else if (choice === 'push') {
        await pushCommand();
      } else if (choice === 'config') {
        await configCommand();
      }
    } catch (err) {
      note(color.red(err.message), 'Error');
    }
    console.log(); // Spacing
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'pull') {
    try {
      await pullCommand(args[1]);
    } catch (err) {
      console.error(color.red(`Error: ${err.message}`));
      process.exit(1);
    }
  } else if (command === 'push') {
    try {
      await pushCommand(args[1]);
    } catch (err) {
      console.error(color.red(`Error: ${err.message}`));
      process.exit(1);
    }
  } else if (command === 'config') {
    try {
      await configCommand();
    } catch (err) {
      console.error(color.red(`Error: ${err.message}`));
      process.exit(1);
    }
  } else if (command === '--help' || command === '-h') {
    showHelp();
  } else if (command) {
    // If unrecognized, show help
    showHelp();
    process.exit(1);
  } else {
    await interactiveMenu();
  }
}

main().catch(err => {
  console.error(color.red(`Fatal Error: ${err.message}`));
  process.exit(1);
});
