#!/usr/bin/env node
import { CreatorCrawl, CreatorCrawlError } from '@creatorcrawl/sdk'
import { Command } from 'commander'
import { registerAuth, resolveCredential } from './auth'
import { registerInstagram } from './commands/instagram'
import { registerLinkedIn } from './commands/linkedin'
import { registerReddit } from './commands/reddit'
import { registerTiktok } from './commands/tiktok'
import { registerTwitter } from './commands/twitter'
import { registerYoutube } from './commands/youtube'

const program = new Command()

program
  .name('creatorcrawl')
  .description(
    'Scrape TikTok, Instagram, YouTube, LinkedIn, Twitter/X, and Reddit from your terminal.',
  )
  .version('0.4.0')
  .option('-k, --api-key <key>', 'CreatorCrawl API key (or set CREATORCRAWL_API_KEY env)')
  .option('--pretty', 'Pretty-print JSON output (default: compact)')

async function getClient(): Promise<CreatorCrawl> {
  const opts = program.opts()
  const explicitApiKey = opts.apiKey as string | undefined
  const credential = explicitApiKey ? { apiKey: explicitApiKey, source: 'environment' as const } : await resolveCredential()
  if (!credential) {
    console.error('Error: authentication required. Run creatorcrawl auth login.')
    process.exit(1)
  }
  return new CreatorCrawl(
    credential.accessToken
      ? { accessToken: credential.accessToken }
      : { apiKey: credential.apiKey },
  )
}

export function output(data: unknown): void {
  const opts = program.opts()
  console.log(JSON.stringify(data, null, opts.pretty ? 2 : undefined))
}

export async function run(fn: () => Promise<unknown>): Promise<void> {
  try {
    const result = await fn()
    output(result)
  } catch (err) {
    if (err instanceof CreatorCrawlError) {
      console.error(`Error ${err.status}: ${err.message}`)
    } else if (err instanceof Error) {
      console.error(`Error: ${err.message}`)
    } else {
      console.error('Unknown error:', err)
    }
    process.exit(1)
  }
}

registerAuth(program)
registerTiktok(program, getClient)
registerInstagram(program, getClient)
registerYoutube(program, getClient)
registerLinkedIn(program, getClient)
registerTwitter(program, getClient)
registerReddit(program, getClient)

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? `Error: ${err.message}` : 'Unknown error')
  process.exit(1)
})
