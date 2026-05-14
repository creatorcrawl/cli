import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerYoutube(program: Command, getClient: () => CreatorCrawl): void {
  const youtube = program.command('youtube').description('YouTube endpoints')

  youtube
    .command('channel <handle>')
    .description('Get YouTube channel by handle')
    .action((handle: string) => run(() => getClient().youtube.channel({ handle })))

  youtube
    .command('videos <handle>')
    .description("Get a YouTube channel's recent videos")
    .action((handle: string) => run(() => getClient().youtube.channelVideos({ handle })))

  youtube
    .command('shorts <handle>')
    .description("Get a YouTube channel's recent shorts")
    .action((handle: string) => run(() => getClient().youtube.channelShorts({ handle })))

  youtube
    .command('video <url>')
    .description('Get info for a single YouTube video')
    .action((url: string) => run(() => getClient().youtube.video({ url })))

  youtube
    .command('search <query>')
    .description('Search YouTube by keyword')
    .action((query: string) => run(() => getClient().youtube.search({ query })))

  youtube
    .command('transcript <url>')
    .description('Get the transcript of a YouTube video')
    .action((url: string) => run(() => getClient().youtube.transcript({ url })))

  youtube
    .command('comments <url>')
    .description('Get comments on a YouTube video')
    .action((url: string) => run(() => getClient().youtube.comments({ url })))

  youtube
    .command('playlist <url>')
    .description('Get YouTube playlist contents')
    .action((url: string) => run(() => getClient().youtube.playlist({ url })))
}
