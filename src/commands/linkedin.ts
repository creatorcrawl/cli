import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerLinkedIn(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const linkedin = program.command('linkedin').description('LinkedIn endpoints')

  linkedin
    .command('profile <url>')
    .description('Get LinkedIn person profile by URL')
    .action((url: string) => run(async () => (await getClient()).linkedin.profile({ url })))

  linkedin
    .command('company <url>')
    .description('Get LinkedIn company page by URL')
    .action((url: string) => run(async () => (await getClient()).linkedin.company({ url })))

  linkedin
    .command('company-posts <url>')
    .description('Get recent posts from a LinkedIn company page')
    .action((url: string) => run(async () => (await getClient()).linkedin.companyPosts({ url })))

  linkedin
    .command('post <url>')
    .description('Get info for a single LinkedIn post')
    .action((url: string) => run(async () => (await getClient()).linkedin.post({ url })))

  linkedin
    .command('ads <keyword>')
    .description('Search the LinkedIn Ad Library by keyword (or pass a company name)')
    .action((keyword: string) => run(async () => (await getClient()).linkedin.adsSearch({ keyword })))

  linkedin
    .command('ad <url>')
    .description('Get info for a single LinkedIn ad')
    .action((url: string) => run(async () => (await getClient()).linkedin.ad({ url })))
}
