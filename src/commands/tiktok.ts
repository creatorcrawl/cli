import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerTiktok(program: Command, getClient: () => CreatorCrawl): void {
  const tiktok = program.command('tiktok').description('TikTok endpoints')

  tiktok
    .command('profile <handle>')
    .description('Get TikTok profile by handle')
    .action((handle: string) => run(() => getClient().tiktok.profile({ handle })))

  tiktok
    .command('videos <handle>')
    .description("Get a TikTok user's recent videos")
    .action((handle: string) => run(() => getClient().tiktok.profileVideos({ handle })))

  tiktok
    .command('video <url>')
    .description('Get info for a single TikTok video')
    .action((url: string) => run(() => getClient().tiktok.videoInfo({ url })))

  tiktok
    .command('transcript <url>')
    .description('Get the transcript of a TikTok video')
    .action((url: string) => run(() => getClient().tiktok.transcript({ url })))

  tiktok
    .command('search <query>')
    .description('Search TikTok by keyword')
    .action((query: string) => run(() => getClient().tiktok.searchKeyword({ query })))

  tiktok
    .command('users <query>')
    .description('Search TikTok users')
    .action((query: string) => run(() => getClient().tiktok.searchUsers({ query })))

  tiktok
    .command('comments <url>')
    .description('Get comments on a TikTok video')
    .action((url: string) => run(() => getClient().tiktok.comments({ url })))
}
