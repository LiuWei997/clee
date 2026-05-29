import { loadConfig } from './config.js';

// Helper to get headers
function getHeaders(config, titleSlug = '') {
  const domain = config.domain || 'leetcode.com';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': titleSlug ? `https://${domain}/problems/${titleSlug}/` : `https://${domain}/`,
    'Origin': `https://${domain}`,
  };

  if (config.LEETCODE_SESSION && config.csrftoken) {
    headers['Cookie'] = `csrftoken=${config.csrftoken}; LEETCODE_SESSION=${config.LEETCODE_SESSION}`;
    headers['x-csrftoken'] = config.csrftoken;
  }

  return headers;
}

// Fetch problem list or search problem by ID
export async function searchProblem(searchTerm) {
  const config = loadConfig();
  const domain = config.domain || 'leetcode.com';
  const url = `https://${domain}/graphql/`;

  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          frontendQuestionId: questionFrontendId
          title
          titleSlug
          difficulty
        }
      }
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      query,
      variables: {
        categorySlug: '',
        skip: 0,
        limit: 50,
        filters: { searchKeywords: searchTerm },
      },
      operationName: 'problemsetQuestionList',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch problem search: ${response.statusText}. Response: ${errorText}`);
  }

  const json = await response.json();
  const questions = json.data?.problemsetQuestionList?.questions || [];
  return questions;
}

// Fetch problem details by slug
export async function getProblemDetails(titleSlug) {
  const config = loadConfig();
  const domain = config.domain || 'leetcode.com';
  const url = `https://${domain}/graphql/`;

  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        content
        difficulty
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify({
      query,
      variables: { titleSlug },
      operationName: 'questionData',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch problem details: ${response.statusText}`);
  }

  const json = await response.json();
  const question = json.data?.question;
  if (!question) {
    throw new Error(`Problem not found for slug: ${titleSlug}`);
  }
  return question;
}

// Submit solution
export async function submitSolution(titleSlug, questionId, langSlug, code) {
  const config = loadConfig();
  if (!config.LEETCODE_SESSION || !config.csrftoken) {
    throw new Error('Authentication required. Please configure your LeetCode session credentials.');
  }

  const domain = config.domain || 'leetcode.com';
  const url = `https://${domain}/problems/${titleSlug}/submit/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(config, titleSlug),
    body: JSON.stringify({
      lang: langSlug,
      question_id: questionId,
      typed_code: code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Submission failed with status ${response.status}: ${errorText || response.statusText}`);
  }

  const json = await response.json();
  if (!json.submission_id) {
    throw new Error(`Submission failed: No submission ID returned. Response: ${JSON.stringify(json)}`);
  }

  return json.submission_id;
}

// Poll submission status
export async function checkSubmissionStatus(submissionId, titleSlug) {
  const config = loadConfig();
  const domain = config.domain || 'leetcode.com';
  const url = `https://${domain}/submissions/detail/${submissionId}/check/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config, titleSlug),
  });

  if (!response.ok) {
    throw new Error(`Failed to check submission status: ${response.statusText}`);
  }

  return await response.json();
}
