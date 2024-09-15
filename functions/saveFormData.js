RC
got this error: Sep 14, 09:03:01 PM: ERROR Uncaught Exception {"errorType":"Error","errorMessage":"require() of ES Module /var/task/node_modules/@octokit/rest/dist-src/index.js from /var/task/functions/saveFormData.js not supported.\nInstead change the require of index.js in /var/task/functions/saveFormData.js to a dynamic import() which is available in all CommonJS modules.","code":"ERR_REQUIRE_ESM","stack":["Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/@octokit/rest/dist-src/index.js from /var/task/functions/saveFormData.js not supported.","Instead change the require of index.js in /var/task/functions/saveFormData.js to a dynamic import() which is available in all CommonJS modules."," at Object.<anonymous> (/var/task/functions/saveFormData.js:1:21)"," at Object.<anonymous> (/var/task/saveFormData.js:1:18)"," at *tryRequireFile (file:///var/runtime/index.mjs:1002:37)"," at *tryRequire (file:///var/runtime/index.mjs:1052:25)"," at _loadUserApp (file:///var/runtime/index.mjs:1081:22)"," at UserFunction.js.module.exports.load (file:///var/runtime/index.mjs:1119:27)"," at start (file:///var/runtime/index.mjs:1282:42)"," at file:///var/runtime/index.mjs:1288:7"]}
Sep 14, 09:03:01 PM: INIT_REPORT Init Duration: 290.82 ms Phase: init Status: error Error Type: Runtime.Unknown
Sep 14, 09:03:01 PM: ERROR Uncaught Exception {"errorType":"Error","errorMessage":"require() of ES Module /var/task/node_modules/@octokit/rest/dist-src/index.js from /var/task/functions/saveFormData.js not supported.\nInstead change the require of index.js in /var/task/functions/saveFormData.js to a dynamic import() which is available in all CommonJS modules.","code":"ERR_REQUIRE_ESM","stack":["Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/@octokit/rest/dist-src/index.js from /var/task/functions/saveFormData.js not supported.","Instead change the require of index.js in /var/task/functions/saveFormData.js to a dynamic import() which is available in all CommonJS modules."," at Object.<anonymous> (/var/task/functions/saveFormData.js:1:21)"," at Object.<anonymous> (/var/task/saveFormData.js:1:18)"," at *tryRequireFile (file:///var/runtime/index.mjs:1002:37)"," at *tryRequire (file:///var/runtime/index.mjs:1052:25)"," at _loadUserApp (file:///var/runtime/index.mjs:1081:22)"," at UserFunction.js.module.exports.load (file:///var/runtime/index.mjs:1119:27)"," at start (file:///var/runtime/index.mjs:1282:42)"," at file:///var/runtime/index.mjs:1288:7"]}


I apologize for the confusion. The error you're seeing is due to a compatibility issue between the @octokit/rest package (which is an ES module) and the Netlify Functions environment (which uses CommonJS). Let's modify our approach to use a different GitHub API client that's compatible with CommonJS. We'll use the @octokit/core package instead.

Here's an updated version of your saveFormData.js function:

javascript

Copy
const { Octokit } = require("@octokit/core");

exports.handler = async (event) => {
  // Parse the incoming data
  let data;
  try {
    data = JSON.parse(event.body);
    data.timestamp = new Date().toISOString();
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  // Initialize GitHub API client
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    // Prepare the content to be saved
    const content = `${JSON.stringify(data, null, 2)}\n\n`;

    // Get the current content of the file (if it exists)
    let currentContent = '';
    let sha;
    try {
      const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'form-submissions.txt',
      });
      currentContent = Buffer.from(fileData.content, 'base64').toString();
      sha = fileData.sha;
    } catch (error) {
      // File doesn't exist yet, which is fine
    }

    // Append new content to existing content
    const newContent = currentContent + content;

    // Save the updated content to the file
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'form-submissions.txt',
      message: 'New form submission',
      content: Buffer.from(newContent).toString('base64'),
      sha: sha,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Form submission saved successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save form submission' }),
    };
  }
};
