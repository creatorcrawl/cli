import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'
import { parsePage } from '../options'

export function registerInstagram(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const instagram = program.command('instagram').description('Instagram endpoints')

  instagram
    .command('profile <handle>')
    .description('Get an Instagram profile by handle')
    .action((handle: string) => run(async () => (await getClient()).instagram.profile({ handle })))

  instagram
    .command('basic-profile <userId>')
    .description('Get a basic Instagram profile by numeric user ID')
    .action((userId: string) =>
      run(async () => (await getClient()).instagram.basicProfile({ userId })),
    )

  instagram
    .command('posts <handle>')
    .description("Get an Instagram user's recent posts")
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((handle: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).instagram.posts({ next_max_id: options.cursor, handle })),
    )

  instagram
    .command('reels <handle>')
    .description("Get an Instagram user's recent reels")
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((handle: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).instagram.reels({ max_id: options.cursor, handle })),
    )

  instagram
    .command('post <url>')
    .description('Get info for a single Instagram post')
    .action((url: string) => run(async () => (await getClient()).instagram.postInfo({ url })))

  instagram
    .command('comments <url>')
    .description('Get comments on an Instagram post')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((url: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).instagram.comments({ ...options, url })),
    )

  instagram
    .command('transcript <url>')
    .description('Get the transcript of an Instagram reel')
    .action((url: string) => run(async () => (await getClient()).instagram.transcript({ url })))

  instagram
    .command('highlights <handle>')
    .description("List an Instagram user's story highlights")
    .action((handle: string) =>
      run(async () => (await getClient()).instagram.storyHighlights({ handle })),
    )

  instagram
    .command('highlight <id>')
    .description('Get the contents of one Instagram highlight by ID')
    .action((id: string) =>
      run(async () => (await getClient()).instagram.highlightsDetails({ id })),
    )

  instagram
    .command('search-reels <query>')
    .description('Search Instagram reels by keyword')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((query: string, options: { page?: string }) =>
      run(async () => (await getClient()).instagram.searchReels({ ...options, query })),
    )

  instagram
    .command('embed <handle>')
    .description('Get embeddable Instagram profile HTML')
    .action((handle: string) => run(async () => (await getClient()).instagram.embed({ handle })))
}
