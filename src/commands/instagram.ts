import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerInstagram(program: Command, getClient: () => CreatorCrawl): void {
  const instagram = program.command('instagram').description('Instagram endpoints')

  instagram
    .command('profile <handle>')
    .description('Get an Instagram profile by handle')
    .action((handle: string) => run(() => getClient().instagram.profile({ handle })))

  instagram
    .command('basic-profile <userId>')
    .description('Get a basic Instagram profile by numeric user ID')
    .action((userId: string) => run(() => getClient().instagram.basicProfile({ userId })))

  instagram
    .command('posts <handle>')
    .description("Get an Instagram user's recent posts")
    .action((handle: string) => run(() => getClient().instagram.posts({ handle })))

  instagram
    .command('reels <handle>')
    .description("Get an Instagram user's recent reels")
    .action((handle: string) => run(() => getClient().instagram.reels({ handle })))

  instagram
    .command('post <url>')
    .description('Get info for a single Instagram post')
    .action((url: string) => run(() => getClient().instagram.postInfo({ url })))

  instagram
    .command('comments <url>')
    .description('Get comments on an Instagram post')
    .action((url: string) => run(() => getClient().instagram.comments({ url })))

  instagram
    .command('transcript <url>')
    .description('Get the transcript of an Instagram reel')
    .action((url: string) => run(() => getClient().instagram.transcript({ url })))

  instagram
    .command('highlights <handle>')
    .description("List an Instagram user's story highlights")
    .action((handle: string) => run(() => getClient().instagram.storyHighlights({ handle })))

  instagram
    .command('highlight <id>')
    .description('Get the contents of one Instagram highlight by ID')
    .action((id: string) => run(() => getClient().instagram.highlightsDetails({ id })))

  instagram
    .command('search-reels <query>')
    .description('Search Instagram reels by keyword')
    .action((query: string) => run(() => getClient().instagram.searchReels({ query })))

  instagram
    .command('embed <handle>')
    .description('Get embeddable Instagram profile HTML')
    .action((handle: string) => run(() => getClient().instagram.embed({ handle })))
}
