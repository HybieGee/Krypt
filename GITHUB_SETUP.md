# GitHub Integration Setup for Krypt Terminal

This guide explains how to set up automatic GitHub commits when Krypt generates code.

## How It Works

When Krypt AI sends a log entry with `type: 'code'` and includes actual code in `details.code`, the system will:
1. Automatically create a commit in the KryptChain repository
2. Push the code to the appropriate file path
3. Display a GitHub notification in the terminal

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Krypt Terminal Bot"
4. Select these scopes:
   - `repo` (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)

### 2. Add Token to Cloudflare Worker

```bash
# Add the GitHub token as an environment variable
wrangler secret put GITHUB_TOKEN
# Paste your token when prompted
```

### 3. Deploy the Updated Worker

```bash
npx wrangler deploy workers/krypt-worker-unified.js
```

## API Format for Krypt

When Krypt sends logs to `/api/krypt/logs/add`, it should use this format for code:

```json
{
  "id": "unique-log-id",
  "type": "code",
  "message": "Created BlockValidator component",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "code": "export class BlockValidator {\n  // ... actual TypeScript code ...\n}",
    "fileName": "BlockValidator.ts",
    "filePath": "src/blockchain/BlockValidator.ts",
    "component": "BlockValidator",
    "phase": "Core Development"
  }
}
```

### Required Fields for GitHub Commit:
- `type`: Must be `"code"`
- `details.code`: The actual code content
- `message`: Used for commit message

### Optional Fields:
- `details.fileName`: Name of the file (defaults to `component_[timestamp].ts`)
- `details.filePath`: Full path in repo (defaults to `src/blockchain/[fileName]`)
- `details.component`: Component name for commit message
- `details.phase`: Development phase for commit message

## Commit Message Format

The system generates commit messages like:
- `feat(BlockValidator): Created BlockValidator component`
- `feat: Implemented consensus mechanism`

All commits are signed as:
- Author: Krypt AI
- Email: ai@kryptterminal.com

## Terminal Display

When a commit is successful, users will see:
```
🔄 Pushed to GitHub: src/blockchain/BlockValidator.ts
```

This appears as a purple-colored log entry in the terminal.

## Testing

### Test with cURL:
```bash
curl -X POST https://kryptterminal.com/api/krypt/logs/add \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "type": "code",
    "message": "Test component creation",
    "details": {
      "code": "// Test code\nexport class TestComponent {\n  constructor() {\n    console.log(\"Test\");\n  }\n}",
      "fileName": "TestComponent.ts",
      "component": "TestComponent"
    }
  }'
```

## Important Notes

1. **Repository must exist**: The KryptChain repository must be created first
2. **Main branch**: Code is pushed to the `main` branch
3. **File conflicts**: If a file already exists, it will be overwritten
4. **Private repos**: Works with both public and private repositories
5. **Rate limits**: GitHub API has rate limits (5000 requests/hour with token)

## Monitoring

Check the Cloudflare Worker logs to see GitHub commit status:
```bash
wrangler tail
```

Successful commits show:
```
✅ Committed src/blockchain/BlockValidator.ts to GitHub (abc1234)
```

## Troubleshooting

### Token Issues
- Ensure token has `repo` scope
- Check token hasn't expired
- Verify token is correctly set in Cloudflare

### Repository Issues
- Ensure repository exists at `github.com/KryptTerminal/KryptChain`
- Check you have write access
- Verify `main` branch exists

### Code Issues
- Code must be valid UTF-8 text
- File paths should not contain special characters
- Maximum file size is limited by GitHub API (100MB)

## Security

- **Never commit the GitHub token to code**
- Token is stored securely in Cloudflare environment variables
- Each commit is tracked with SHA for audit trail
- Failed commits don't stop log processing

## Future Enhancements

- Branch selection (currently only main)
- Pull request creation instead of direct commits
- File organization by component type
- Automatic README updates
- Dependency management