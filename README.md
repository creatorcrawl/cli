# creatorcrawl CLI

> **0.3 returns the new canonical response shape — see the SDK changelog for details.**

Official command-line interface for [CreatorCrawl](https://creatorcrawl.com). Scrape **TikTok, Instagram, YouTube, LinkedIn, Twitter/X, and Reddit** from your terminal or shell scripts.

## Install

The standalone CLI is independent of the agent skill.

On macOS or Linux:

```bash
curl -fsSL https://creatorcrawl.com/install.sh | sh
creatorcrawl auth login
creatorcrawl tiktok profile khaby.lame
```

The installer sets up Node.js if needed and writes the command to `~/.local/bin/creatorcrawl` without `sudo`.
It installs only the CLI. Follow its PATH instructions if your shell cannot find the command.
Override `CREATORCRAWL_VERSION` or `CREATORCRAWL_BIN_DIR` when needed.

With Node.js 18+, run the verified release using npx on macOS, Linux, or Windows:

```bash
npx --yes --package=https://github.com/creatorcrawl/cli/releases/download/v0.4.2/creatorcrawl-0.4.2.tgz creatorcrawl --help
npx --yes --package=https://github.com/creatorcrawl/cli/releases/download/v0.4.2/creatorcrawl-0.4.2.tgz creatorcrawl auth login
```

For a persistent command:

```bash
npm install -g https://github.com/creatorcrawl/cli/releases/download/v0.4.2/creatorcrawl-0.4.2.tgz
creatorcrawl --help
```

The updated npm package is awaiting publication; npm currently serves the older 0.3.0 release.
Use the GitHub release commands above until publication completes.

## Agent skill

Install the API-only skill separately for Claude Code, Codex, Cursor, or another coding agent:

```bash
npx skills add creatorcrawl/creatorcrawl-skill
```

Choose your agent and scope; add `--global` for use across projects.
The skill includes API instructions, endpoint references, and research workflows.
It calls REST directly using `CREATORCRAWL_API_KEY` in the agent environment; it does not install the CLI.

## Authenticate

For interactive use, sign in through CreatorCrawl OAuth:

```bash
creatorcrawl auth login
```

The CLI opens CreatorCrawl in your browser or prints a sign-in link. Sign in or create an account, approve access, and return to your terminal. No API key is required. It uses Authorization Code + PKCE, stores OAuth credentials in macOS Keychain when available, and refreshes access automatically. For agents and CI, pass an API key non-interactively during installation:

```bash
curl -fsSL https://creatorcrawl.com/install.sh | CREATORCRAWL_API_KEY="sk_live_..." sh
```

API keys remain supported for automation:

```bash
export CREATORCRAWL_API_KEY=sk_live_...
creatorcrawl tiktok profile khaby.lame
```

Or pass it per command:

```bash
creatorcrawl --api-key sk_live_... tiktok profile khaby.lame
```

Use `creatorcrawl auth status --json` to check authentication and `creatorcrawl auth logout` to remove the saved credential.

## Commands

```
creatorcrawl tiktok    profile|videos|video|transcript|search|users|comments
creatorcrawl instagram profile|posts|post|reels|comments|transcript
creatorcrawl youtube   channel|videos|shorts|video|search|transcript|comments|playlist
creatorcrawl linkedin  profile|company|company-posts|post|ads|ad
creatorcrawl twitter   profile|tweet|tweets|transcript|community|community-tweets
creatorcrawl reddit    search|subreddit|subreddit-posts|subreddit-search|comments
```

Run `creatorcrawl <platform> --help` for subcommand details.

## Output

Default: compact JSON (greppable, pipeable).

All responses use a unified envelope: `{ data, page?, meta }`. `data` holds the canonical record (`Creator`, `Post`, `Comment`, or a list of these). `meta` always includes `platform` and `fetched_at`.

```bash
creatorcrawl tiktok profile khaby.lame | jq '.data.handle, .data.follower_count'
```

Sample response:

```json
{
  "data": {
    "handle": "khaby.lame",
    "follower_count": 162000000,
    "platform": "tiktok"
  },
  "meta": {
    "platform": "tiktok",
    "fetched_at": "2026-05-15T10:00:00Z"
  }
}
```

Pretty-print:

```bash
creatorcrawl --pretty tiktok profile khaby.lame
```

## Examples

```bash
# Profile
creatorcrawl tiktok profile stoolpresidente

# Transcript a video and pipe to a file
creatorcrawl youtube transcript https://youtu.be/dQw4w9WgXcQ > transcript.json

# Search and extract top-5 channels
creatorcrawl youtube search "ai tools" | jq '.data[:5]'

# LinkedIn ad library lookup
creatorcrawl linkedin ads stripe

# Loop over a list of handles
for h in stoolpresidente khaby.lame zachking; do
  creatorcrawl tiktok profile "$h"
done

# Use in CI / scripts
CREATORCRAWL_API_KEY=sk_live_... \
  creatorcrawl reddit subreddit-posts ProgrammerHumor
```

## Configuration

| Flag | Env var | Description |
|---|---|---|
| `-k`, `--api-key <key>` | `CREATORCRAWL_API_KEY` | Your CreatorCrawl API key |
| `--pretty` | — | Pretty-print JSON output (default: compact) |

## Companion packages

- **TypeScript SDK:** [`@creatorcrawl/sdk`](https://www.npmjs.com/package/@creatorcrawl/sdk) — for code workflows
- **Hosted MCP endpoint:** [`https://app.creatorcrawl.com/api/mcp`](https://creatorcrawl.com/mcp-docs) — for compatible AI agents
- **Agent Skill:** [`creatorcrawl/creatorcrawl-skill`](https://github.com/creatorcrawl/creatorcrawl-skill) — teaches agents how to use CreatorCrawl

## Pricing

Pay-as-you-go credits starting at $29 for 5,000 credits. Full pricing at [creatorcrawl.com/#pricing](https://creatorcrawl.com/#pricing).

## License

MIT
