import {intro, password, text, spinner, outro, isCancel, select} from '@clack/prompts';
import puppeteer from 'puppeteer';

/**
 * Configure Credentials page.
 * @param {object} context
 * @returns {Promise<string>} Next page
 */
export default async function run(context) {

  if (isCancel(choice)) return 'index';
  return choice;
}

