#!/usr/bin/env node
import { CreatorCrawl, CreatorCrawlError } from '@creatorcrawl/sdk'
import { Command } from 'commander'
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
  .version('0.3.1')
  .option('-k, --api-key <key>', 'CreatorCrawl API key (or set CREATORCRAWL_API_KEY env)')
  .option('--pretty', 'Pretty-print JSON output (default: compact)')

function getClient(): CreatorCrawl {
  const opts = program.opts()
  const apiKey = (opts.apiKey as string | undefined) ?? process.env.CREATORCRAWL_API_KEY
  if (!apiKey) {
    console.error('Error: API key required. Pass --api-key or set CREATORCRAWL_API_KEY.')
    console.error('Get a free key (250 credits) at https://creatorcrawl.com')
    process.exit(1)
  }
  return new CreatorCrawl({ apiKey })
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

registerTiktok(program, getClient)
registerInstagram(program, getClient)
registerYoutube(program, getClient)
registerLinkedIn(program, getClient)
registerTwitter(program, getClient)
registerReddit(program, getClient)

program.parseAsync().catch((err) => {
  console.error(err)
  process.exit(1)
})
