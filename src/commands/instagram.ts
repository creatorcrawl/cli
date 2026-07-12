import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerInstagram(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const instagram = program.command('instagram').description('Instagram endpoints')

  instagram
    .command('profile <handle>')
    .description('Get an Instagram profile by handle')
    .action((handle: string) => run(async () => (await getClient()).instagram.profile({ handle })))

  instagram
    .command('basic-profile <userId>')
    .description('Get a basic Instagram profile by numeric user ID')
    .action((userId: string) => run(async () => (await getClient()).instagram.basicProfile({ userId })))

  instagram
    .command('posts <handle>')
    .description("Get an Instagram user's recent posts")
    .action((handle: string) => run(async () => (await getClient()).instagram.posts({ handle })))

  instagram
    .command('reels <handle>')
    .description("Get an Instagram user's recent reels")
    .action((handle: string) => run(async () => (await getClient()).instagram.reels({ handle })))

  instagram
    .command('post <url>')
    .description('Get info for a single Instagram post')
    .action((url: string) => run(async () => (await getClient()).instagram.postInfo({ url })))

  instagram
    .command('comments <url>')
    .description('Get comments on an Instagram post')
    .action((url: string) => run(async () => (await getClient()).instagram.comments({ url })))

  instagram
    .command('transcript <url>')
    .description('Get the transcript of an Instagram reel')
    .action((url: string) => run(async () => (await getClient()).instagram.transcript({ url })))

  instagram
    .command('highlights <handle>')
    .description("List an Instagram user's story highlights")
    .action((handle: string) => run(async () => (await getClient()).instagram.storyHighlights({ handle })))

  instagram
    .command('highlight <id>')
    .description('Get the contents of one Instagram highlight by ID')
    .action((id: string) => run(async () => (await getClient()).instagram.highlightsDetails({ id })))

  instagram
    .command('search-reels <query>')
    .description('Search Instagram reels by keyword')
    .action((query: string) => run(async () => (await getClient()).instagram.searchReels({ query })))

  instagram
    .command('embed <handle>')
    .description('Get embeddable Instagram profile HTML')
    .action((handle: string) => run(async () => (await getClient()).instagram.embed({ handle })))
}
