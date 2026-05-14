import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerInstagram(program: Command, getClient: () => CreatorCrawl): void {
  const instagram = program.command('instagram').description('Instagram endpoints')

  instagram
    .command('profile <handle>')
    .description('Get Instagram profile by handle')
    .action((handle: string) => run(() => getClient().instagram.profile({ handle })))

  instagram
    .command('posts <handle>')
    .description("Get an Instagram user's recent posts")
    .action((handle: string) => run(() => getClient().instagram.posts({ handle })))

  instagram
    .command('post <url>')
    .description('Get info for a single Instagram post')
    .action((url: string) => run(() => getClient().instagram.postInfo({ url })))

  instagram
    .command('reels <handle>')
    .description("Get an Instagram user's recent reels")
    .action((handle: string) => run(() => getClient().instagram.reels({ handle })))

  instagram
    .command('comments <url>')
    .description('Get comments on an Instagram post')
    .action((url: string) => run(() => getClient().instagram.comments({ url })))

  instagram
    .command('transcript <url>')
    .description('Get the transcript of an Instagram reel')
    .action((url: string) => run(() => getClient().instagram.transcript({ url })))
}
