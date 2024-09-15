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
