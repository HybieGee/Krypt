// GitHub Integration for Krypt Terminal
// Automatically commits code from Krypt's development logs to GitHub

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'KryptTerminal';
const REPO_NAME = 'KryptChain';

// You'll need to set this as an environment variable in Cloudflare
// Generate a GitHub Personal Access Token with repo permissions
// Store it as GITHUB_TOKEN in your worker environment variables

class GitHubIntegration {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Krypt-Terminal-Bot'
    };
  }

  // Get the current SHA of the main branch
  async getMainBranchSHA() {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get main branch SHA: ${response.status}`);
    }
    
    const data = await response.json();
    return data.object.sha;
  }

  // Get the base tree SHA
  async getTreeSHA(commitSHA) {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${commitSHA}`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get tree SHA: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tree.sha;
  }

  // Create a new blob for the file content
  async createBlob(content) {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          content: btoa(content), // Base64 encode
          encoding: 'base64'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create blob: ${response.status}`);
    }
    
    const data = await response.json();
    return data.sha;
  }

  // Create a new tree with the file
  async createTree(baseTreeSHA, filePath, blobSHA) {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          base_tree: baseTreeSHA,
          tree: [{
            path: filePath,
            mode: '100644', // File mode
            type: 'blob',
            sha: blobSHA
          }]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create tree: ${response.status}`);
    }
    
    const data = await response.json();
    return data.sha;
  }

  // Create a commit
  async createCommit(message, treeSHA, parentSHA) {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          message: message,
          author: {
            name: 'Krypt AI',
            email: 'krypt@kryptterminal.com',
            date: new Date().toISOString()
          },
          tree: treeSHA,
          parents: [parentSHA]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create commit: ${response.status}`);
    }
    
    const data = await response.json();
    return data.sha;
  }

  // Update the reference to point to the new commit
  async updateRef(commitSHA) {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          sha: commitSHA,
          force: false
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update ref: ${response.status}`);
    }
    
    return await response.json();
  }

  // Main function to commit code from a log entry
  async commitCodeFromLog(logEntry) {
    try {
      // Only process logs with code
      if (!logEntry.details?.code || logEntry.type !== 'code') {
        return null;
      }

      const code = logEntry.details.code;
      const fileName = logEntry.details.fileName || this.generateFileName(logEntry);
      const filePath = logEntry.details.filePath || `src/blockchain/${fileName}`;
      const commitMessage = this.generateCommitMessage(logEntry);

      console.log(`Committing ${filePath} to GitHub...`);

      // Get current state
      const mainSHA = await this.getMainBranchSHA();
      const treeSHA = await this.getTreeSHA(mainSHA);
      
      // Create new content
      const blobSHA = await this.createBlob(code);
      const newTreeSHA = await this.createTree(treeSHA, filePath, blobSHA);
      
      // Create and push commit
      const commitSHA = await this.createCommit(commitMessage, newTreeSHA, mainSHA);
      await this.updateRef(commitSHA);

      console.log(`✅ Successfully committed ${filePath} (${commitSHA.substring(0, 7)})`);
      
      return {
        success: true,
        sha: commitSHA,
        filePath: filePath,
        message: commitMessage
      };

    } catch (error) {
      console.error('GitHub commit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate a file name from the log entry
  generateFileName(logEntry) {
    // Extract component name from message if possible
    const messageMatch = logEntry.message.match(/(?:component|class|module|interface)\s+(\w+)/i);
    if (messageMatch) {
      return `${messageMatch[1]}.ts`;
    }
    
    // Default to timestamp-based name
    const timestamp = new Date(logEntry.timestamp).getTime();
    return `component_${timestamp}.ts`;
  }

  // Generate commit message from log entry
  generateCommitMessage(logEntry) {
    const phase = logEntry.details?.phase || 'Development';
    const component = logEntry.details?.component || 'Component';
    
    // Extract key info from the message
    if (logEntry.message.includes('✅')) {
      return logEntry.message.replace('✅', '').trim();
    }
    
    return `${phase}: Add ${component} - ${logEntry.message}`;
  }

  // Batch commit multiple code entries
  async batchCommitLogs(logEntries) {
    const results = [];
    
    for (const log of logEntries) {
      if (log.type === 'code' && log.details?.code) {
        const result = await this.commitCodeFromLog(log);
        results.push(result);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

// Export the handler function for the worker
export async function handleGitHubCommitFromLog(request, env) {
  try {
    const logEntry = await request.json();
    
    // Check if GitHub token is configured
    if (!env.GITHUB_TOKEN) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GitHub token not configured'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const github = new GitHubIntegration(env.GITHUB_TOKEN);
    const result = await github.commitCodeFromLog(logEntry);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('GitHub handler error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to integrate with existing log handlers
export async function processLogForGitHub(logEntry, env) {
  // Only process code logs with actual code content
  if (logEntry.type !== 'code' || !logEntry.details?.code) {
    return null;
  }

  // Skip if GitHub integration is disabled
  if (!env.GITHUB_TOKEN || env.GITHUB_INTEGRATION_ENABLED === 'false') {
    return null;
  }

  try {
    const github = new GitHubIntegration(env.GITHUB_TOKEN);
    return await github.commitCodeFromLog(logEntry);
  } catch (error) {
    console.error('Failed to commit to GitHub:', error);
    return null;
  }
}

export { GitHubIntegration };