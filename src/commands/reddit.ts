import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerReddit(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const reddit = program.command('reddit').description('Reddit endpoints')

  reddit
    .command('search <query>')
    .description('Search Reddit by keyword')
    .action((query: string) => run(async () => (await getClient()).reddit.search({ query })))

  reddit
    .command('subreddit <subreddit>')
    .description('Get details for a subreddit')
    .action((subreddit: string) =>
      run(async () => (await getClient()).reddit.subredditDetails({ subreddit })),
    )

  reddit
    .command('subreddit-posts <subreddit>')
    .description('Get recent posts from a subreddit')
    .action((subreddit: string) => run(async () => (await getClient()).reddit.subredditPosts({ subreddit })))

  reddit
    .command('subreddit-search <subreddit> <query>')
    .description('Search within a subreddit')
    .action((subreddit: string, query: string) =>
      run(async () => (await getClient()).reddit.subredditSearch({ subreddit, query })),
    )

  reddit
    .command('comments <url>')
    .description('Get comments on a Reddit post')
    .action((url: string) => run(async () => (await getClient()).reddit.postComments({ url })))
}
