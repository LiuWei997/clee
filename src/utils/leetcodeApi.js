/**
 * Checks if the provided session cookies are valid by query LeetCode userStatus.
 * @param {string} domain - 'leetcode.com' or 'leetcode.cn'
 * @param {string} session - LEETCODE_SESSION cookie value
 * @param {string} csrf - csrftoken cookie value
 * @returns {Promise<{isSignedIn: boolean, username?: string}>}
 */
export async function checkLeetcodeSession(domain, session, csrf) {
  const url = `https://${domain}/graphql/`;
  const query = `
    query userStatus {
      userStatus {
        isSignedIn
        username
      }
    }
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `LEETCODE_SESSION=${session}; csrftoken=${csrf};`,
        'x-csrftoken': csrf,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://${domain}/`
      },
      body: JSON.stringify({
        operationName: 'userStatus',
        variables: {},
        query
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data?.userStatus || { isSignedIn: false };
  } catch (err) {
    throw new Error('Network or GraphQL error: ' + err.message);
  }
}
