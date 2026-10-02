import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerReddit(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const reddit = program.command('reddit').description('Reddit endpoints')

  reddit
    .command('search <query>')
    .description('Search Reddit by keyword')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((query: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).reddit.search({ after: options.cursor, query })),
    )

  reddit
    .command('subreddit <subreddit>')
    .description('Get details for a subreddit')
    .action((subreddit: string) =>
      run(async () => (await getClient()).reddit.subredditDetails({ subreddit })),
    )

  reddit
    .command('subreddit-posts <subreddit>')
    .description('Get recent posts from a subreddit')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((subreddit: string, options: { cursor?: string }) =>
      run(async () =>
        (await getClient()).reddit.subredditPosts({ after: options.cursor, subreddit }),
      ),
    )

  reddit
    .command('subreddit-search <subreddit> <query>')
    .description('Search within a subreddit')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((subreddit: string, query: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).reddit.subredditSearch({ ...options, subreddit, query })),
    )

  reddit
    .command('comments <url>')
    .description('Get comments on a Reddit post')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((url: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).reddit.postComments({ ...options, url })),
    )
}
