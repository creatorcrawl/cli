import type { CreatorCrawl } from '@creatorcrawl/sdk'
import { type Command, Option } from 'commander'
import { normalizeTikTokHandle } from '../handles'
import { run } from '../index'
import { parsePage } from '../options'

export function registerTiktok(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const tiktok = program.command('tiktok').description('TikTok endpoints')

  tiktok
    .command('profile <handle>')
    .description('Get a TikTok profile by handle')
    .action((handle: string) =>
      run(async () =>
        (await getClient()).tiktok.profile({ handle: normalizeTikTokHandle(handle) }),
      ),
    )

  tiktok
    .command('videos <handle>')
    .description("Get a TikTok user's recent videos")
    .addOption(new Option('--sort <order>', 'Sort videos').choices(['latest', 'popular']))
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((handle: string, options: { cursor?: string; sort?: string }) =>
      run(async () =>
        (await getClient()).tiktok.profileVideos({
          max_cursor: options.cursor,
          sort_by: options.sort,
          handle: normalizeTikTokHandle(handle),
        }),
      ),
    )

  tiktok
    .command('video <url>')
    .description('Get info for a single TikTok video')
    .action((url: string) => run(async () => (await getClient()).tiktok.videoInfo({ url })))

  tiktok
    .command('transcript <url>')
    .description('Get the transcript of a TikTok video')
    .action((url: string) => run(async () => (await getClient()).tiktok.transcript({ url })))

  tiktok
    .command('comments <url>')
    .description('Get comments on a TikTok video')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((url: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.comments({ ...options, url })),
    )

  tiktok
    .command('creator-transcripts <handle>')
    .description("Bulk transcripts of a creator's recent videos")
    .action((handle: string) =>
      run(async () =>
        (await getClient()).tiktok.creatorTranscripts({ handle: normalizeTikTokHandle(handle) }),
      ),
    )

  tiktok
    .command('followers <handle>')
    .description("Get a user's followers")
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((handle: string, options: { cursor?: string }) =>
      run(async () =>
        (await getClient()).tiktok.followers({ ...options, handle: normalizeTikTokHandle(handle) }),
      ),
    )

  tiktok
    .command('following <handle>')
    .description('Get accounts a user follows')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((handle: string, options: { cursor?: string }) =>
      run(async () =>
        (await getClient()).tiktok.following({ ...options, handle: normalizeTikTokHandle(handle) }),
      ),
    )

  tiktok
    .command('live <handle>')
    .description("Get a user's live stream info")
    .action((handle: string) =>
      run(async () => (await getClient()).tiktok.live({ handle: normalizeTikTokHandle(handle) })),
    )

  tiktok
    .command('song <clipId>')
    .description('Get details for a TikTok song / sound')
    .action((clipId: string) => run(async () => (await getClient()).tiktok.songDetails({ clipId })))

  tiktok
    .command('song-videos <clipId>')
    .description('Get videos that use a TikTok song / sound')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((clipId: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.songVideos({ ...options, clipId })),
    )

  tiktok
    .command('search <query>')
    .description('Search TikTok by keyword')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((query: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.searchKeyword({ ...options, query })),
    )

  tiktok
    .command('users <query>')
    .description('Search TikTok users')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((query: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.searchUsers({ ...options, query })),
    )

  tiktok
    .command('top <query>')
    .description('TikTok top search results (users + videos + sounds)')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((query: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.searchTop({ ...options, query })),
    )

  tiktok
    .command('hashtag <hashtag>')
    .description('Get videos under a TikTok hashtag')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((hashtag: string, options: { cursor?: string }) =>
      run(async () => (await getClient()).tiktok.searchHashtag({ ...options, hashtag })),
    )

  tiktok
    .command('popular-creators')
    .description('Popular TikTok creators (trending)')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((options: { page?: string }) =>
      run(async () => (await getClient()).tiktok.popularCreators(options)),
    )

  tiktok
    .command('popular-hashtags')
    .description('Popular TikTok hashtags (trending)')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((options: { page?: string }) =>
      run(async () => (await getClient()).tiktok.popularHashtags(options)),
    )

  tiktok
    .command('popular-songs')
    .description('Popular TikTok songs (trending)')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((options: { page?: string }) =>
      run(async () => (await getClient()).tiktok.popularSongs(options)),
    )

  tiktok
    .command('popular-videos')
    .description('Popular TikTok videos (trending)')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((options: { page?: string }) =>
      run(async () => (await getClient()).tiktok.popularVideos(options)),
    )

  tiktok
    .command('trending [region]')
    .description('Current TikTok trending feed for a region (e.g. US)')
    .action((region?: string) =>
      run(async () => (await getClient()).tiktok.trendingFeed({ region })),
    )
}
