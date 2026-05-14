import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerTiktok(program: Command, getClient: () => CreatorCrawl): void {
  const tiktok = program.command('tiktok').description('TikTok endpoints')

  tiktok
    .command('profile <handle>')
    .description('Get a TikTok profile by handle')
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
    .command('comments <url>')
    .description('Get comments on a TikTok video')
    .action((url: string) => run(() => getClient().tiktok.comments({ url })))

  tiktok
    .command('creator-transcripts <handle>')
    .description("Bulk transcripts of a creator's recent videos")
    .action((handle: string) => run(() => getClient().tiktok.creatorTranscripts({ handle })))

  tiktok
    .command('followers <handle>')
    .description("Get a user's followers")
    .action((handle: string) => run(() => getClient().tiktok.followers({ handle })))

  tiktok
    .command('following <handle>')
    .description("Get accounts a user follows")
    .action((handle: string) => run(() => getClient().tiktok.following({ handle })))

  tiktok
    .command('live <handle>')
    .description("Get a user's live stream info")
    .action((handle: string) => run(() => getClient().tiktok.live({ handle })))

  tiktok
    .command('song <clipId>')
    .description('Get details for a TikTok song / sound')
    .action((clipId: string) => run(() => getClient().tiktok.songDetails({ clipId })))

  tiktok
    .command('song-videos <clipId>')
    .description('Get videos that use a TikTok song / sound')
    .action((clipId: string) => run(() => getClient().tiktok.songVideos({ clipId })))

  tiktok
    .command('search <query>')
    .description('Search TikTok by keyword')
    .action((query: string) => run(() => getClient().tiktok.searchKeyword({ query })))

  tiktok
    .command('users <query>')
    .description('Search TikTok users')
    .action((query: string) => run(() => getClient().tiktok.searchUsers({ query })))

  tiktok
    .command('top <query>')
    .description('TikTok top search results (users + videos + sounds)')
    .action((query: string) => run(() => getClient().tiktok.searchTop({ query })))

  tiktok
    .command('hashtag <hashtag>')
    .description('Get videos under a TikTok hashtag')
    .action((hashtag: string) => run(() => getClient().tiktok.searchHashtag({ hashtag })))

  tiktok
    .command('popular-creators')
    .description('Popular TikTok creators (trending)')
    .action(() => run(() => getClient().tiktok.popularCreators()))

  tiktok
    .command('popular-hashtags')
    .description('Popular TikTok hashtags (trending)')
    .action(() => run(() => getClient().tiktok.popularHashtags()))

  tiktok
    .command('popular-songs')
    .description('Popular TikTok songs (trending)')
    .action(() => run(() => getClient().tiktok.popularSongs()))

  tiktok
    .command('popular-videos')
    .description('Popular TikTok videos (trending)')
    .action(() => run(() => getClient().tiktok.popularVideos()))

  tiktok
    .command('trending [region]')
    .description('Current TikTok trending feed for a region (e.g. US)')
    .action((region?: string) => run(() => getClient().tiktok.trendingFeed({ region })))
}
