# creatorcrawl CLI

> **0.3 returns the new canonical response shape — see the SDK changelog for details.**

Official command-line interface for [CreatorCrawl](https://creatorcrawl.com). Scrape **TikTok, Instagram, YouTube, LinkedIn, Twitter/X, and Reddit** from your terminal or shell scripts.

```bash
npx creatorcrawl tiktok profile khaby.lame
npx creatorcrawl youtube transcript https://youtu.be/...
npx creatorcrawl linkedin company https://www.linkedin.com/company/openai
```

## Install

Install with the hosted script on macOS or Linux:

```bash
curl -fsSL https://creatorcrawl.com/install.sh | sh
```

The script downloads the self-contained release executable to `~/.local/bin/creatorcrawl` without requiring `sudo` or npm. It requires Node.js 18 or newer. Override `CREATORCRAWL_VERSION` or `CREATORCRAWL_BIN_DIR` when needed.

Run instantly without installing:

```bash
npx creatorcrawl <command>
```

Or install globally:

```bash
npm install -g creatorcrawl
# or
pnpm add -g creatorcrawl
```

## Authenticate

Get a free API key at [creatorcrawl.com](https://creatorcrawl.com) — **250 credits free on signup, no card required.**

Then either:

```bash
export CREATORCRAWL_API_KEY=cc_...
creatorcrawl tiktok profile khaby.lame
```

Or pass it per command:

```bash
creatorcrawl --api-key cc_... tiktok profile khaby.lame
```

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
CREATORCRAWL_API_KEY=$NPM_TOKEN \
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

Pay-as-you-go credits starting at $29 for 5,000 calls. Full pricing at [creatorcrawl.com/#pricing](https://creatorcrawl.com/#pricing).

## License

MIT
