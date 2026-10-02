import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'
import { parsePage } from '../options'

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
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((url: string, options: { page?: string }) =>
      run(async () => (await getClient()).linkedin.companyPosts({ ...options, url })),
    )

  linkedin
    .command('post <url>')
    .description('Get info for a single LinkedIn post')
    .action((url: string) => run(async () => (await getClient()).linkedin.post({ url })))

  linkedin
    .command('ads <keyword>')
    .description('Search the LinkedIn Ad Library by keyword (or pass a company name)')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((keyword: string, options: { cursor?: string }) =>
      run(async () =>
        (await getClient()).linkedin.adsSearch({ paginationToken: options.cursor, keyword }),
      ),
    )

  linkedin
    .command('ad <url>')
    .description('Get info for a single LinkedIn ad')
    .action((url: string) => run(async () => (await getClient()).linkedin.ad({ url })))
}
