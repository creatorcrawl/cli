import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

export function registerTwitter(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const twitter = program.command('twitter').description('Twitter / X endpoints')

  twitter
    .command('profile <handle>')
    .description('Get Twitter profile by handle')
    .action((handle: string) => run(async () => (await getClient()).twitter.profile({ handle })))

  twitter
    .command('tweet <url>')
    .description('Get info for a single tweet')
    .action((url: string) => run(async () => (await getClient()).twitter.tweet({ url })))

  twitter
    .command('tweets <handle>')
    .description("Get a Twitter user's recent tweets")
    .action((handle: string) => run(async () => (await getClient()).twitter.userTweets({ handle })))

  twitter
    .command('transcript <url>')
    .description('Get the transcript of a video tweet')
    .action((url: string) => run(async () => (await getClient()).twitter.transcript({ url })))

  twitter
    .command('community <url>')
    .description('Get a Twitter community page')
    .action((url: string) => run(async () => (await getClient()).twitter.community({ url })))

  twitter
    .command('community-tweets <url>')
    .description('Get tweets from a Twitter community')
    .action((url: string) => run(async () => (await getClient()).twitter.communityTweets({ url })))
}
