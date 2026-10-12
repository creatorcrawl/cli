import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'

type Cursor = { cursor?: string }
type MediaPage = Cursor & { nextPageId?: string }
type CacheOptions = { cacheMaxAge?: string }
type AdFilters = Cursor & {
  sortBy?: string
  country?: string
  language?: string
  status?: string
  mediaType?: string
  startDate?: string
  endDate?: string
  trim?: boolean
}

const CURSOR_HELP = 'Cursor from the previous response'
const CACHE_HELP = 'Upstream cache age: 1d, 3d, 7d, 14d, or 30d'

function urlOrId<K extends string>(value: string, idKey: K): { url: string } | Record<K, string> {
  return /^https?:\/\//i.test(value) ? { url: value } : ({ [idKey]: value } as Record<K, string>)
}

function adFilters(options: AdFilters) {
  return {
    sort_by: options.sortBy,
    country: options.country,
    language: options.language,
    status: options.status,
    media_type: options.mediaType,
    start_date: options.startDate,
    end_date: options.endDate,
    cursor: options.cursor,
    trim: options.trim,
  }
}

function withAdFilters(command: Command): Command {
  return command
    .option('--sort-by <sort>', 'Sort order, e.g. total_impressions or relevancy_monthly_grouped')
    .option('--country <code>', 'Two-letter country code, e.g. US')
    .option('--language <code>', 'Two-letter language code, e.g. EN')
    .option('--status <status>', 'ACTIVE, INACTIVE, or ALL')
    .option('--media-type <type>', 'ALL, IMAGE, VIDEO, MEME, IMAGE_AND_MEME, or NONE')
    .option('--start-date <date>', 'Start date, YYYY-MM-DD')
    .option('--end-date <date>', 'End date, YYYY-MM-DD')
    .option('--trim', 'Return a trimmed response')
    .option('--cursor <cursor>', CURSOR_HELP)
}

export function registerFacebook(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const facebook = program.command('facebook').description('Facebook endpoints')

  facebook
    .command('profile <url>')
    .description('Get a public Facebook page profile')
    .option('--business-hours', 'Include business hours')
    .option('--gated', 'Include limited gated profile fields')
    .option('--cache-max-age <age>', CACHE_HELP)
    .action(
      (url: string, options: CacheOptions & { businessHours?: boolean; gated?: boolean }) =>
        run(async () =>
          (await getClient()).facebook.profile({
            url,
            get_business_hours: options.businessHours,
            include_gated_profile: options.gated,
            cache_max_age: options.cacheMaxAge,
          }),
        ),
    )

  facebook
    .command('profile-posts <url-or-page-id>')
    .description('Get posts from a public Facebook page by URL or page ID')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((value: string, options: Cursor) =>
      run(async () =>
        (await getClient()).facebook.profilePosts({ ...urlOrId(value, 'pageId'), ...options }),
      ),
    )

  facebook
    .command('profile-reels <url>')
    .description('Get reels from a public Facebook page')
    .option('--next-page-id <id>', 'next_page_id from the previous response')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((url: string, options: MediaPage) =>
      run(async () =>
        (await getClient()).facebook.profileReels({
          url,
          next_page_id: options.nextPageId,
          cursor: options.cursor,
        }),
      ),
    )

  facebook
    .command('profile-photos <url>')
    .description('Get photos from a public Facebook page')
    .option('--next-page-id <id>', 'next_page_id from the previous response')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((url: string, options: MediaPage) =>
      run(async () =>
        (await getClient()).facebook.profilePhotos({
          url,
          next_page_id: options.nextPageId,
          cursor: options.cursor,
        }),
      ),
    )

  facebook
    .command('profile-events <url>')
    .description('Get events published by a public Facebook page')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((url: string, options: Cursor) =>
      run(async () => (await getClient()).facebook.profileEvents({ url, ...options })),
    )

  facebook
    .command('post <url>')
    .description('Get a public Facebook post or reel')
    .option('--cache-max-age <age>', CACHE_HELP)
    .action((url: string, options: CacheOptions) =>
      run(async () =>
        (await getClient()).facebook.post({ url, cache_max_age: options.cacheMaxAge }),
      ),
    )

  facebook
    .command('post-comments <url-or-feedback-id>')
    .description('Get comments on a Facebook post or reel by URL or feedback ID')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((value: string, options: Cursor) =>
      run(async () =>
        (await getClient()).facebook.postComments({ ...urlOrId(value, 'feedback_id'), ...options }),
      ),
    )

  facebook
    .command('comment-replies <feedback-id> <expansion-token>')
    .description('Get replies to a Facebook comment')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((feedbackId: string, expansionToken: string, options: Cursor) =>
      run(async () =>
        (await getClient()).facebook.commentReplies({
          feedback_id: feedbackId,
          expansion_token: expansionToken,
          ...options,
        }),
      ),
    )

  facebook
    .command('post-transcript <url>')
    .description('Get the transcript of a Facebook video or reel under two minutes')
    .option('--cache-max-age <age>', CACHE_HELP)
    .action((url: string, options: CacheOptions) =>
      run(async () =>
        (await getClient()).facebook.postTranscript({ url, cache_max_age: options.cacheMaxAge }),
      ),
    )

  facebook
    .command('group <url-or-group-id>')
    .description('Get a public Facebook group by URL or group ID')
    .action((value: string) =>
      run(async () => (await getClient()).facebook.group(urlOrId(value, 'group_id'))),
    )

  facebook
    .command('group-posts <url-or-group-id>')
    .description('Get posts from a public Facebook group by URL or group ID')
    .option('--sort-by <sort>', 'Sort order, e.g. TOP_POSTS, RECENT_ACTIVITY, CHRONOLOGICAL')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((value: string, options: Cursor & { sortBy?: string }) =>
      run(async () =>
        (await getClient()).facebook.groupPosts({
          ...urlOrId(value, 'group_id'),
          sort_by: options.sortBy,
          cursor: options.cursor,
        }),
      ),
    )

  facebook
    .command('events <url>')
    .description('Get events for a city from its Facebook events URL')
    .option('--time <time>', 'Time filter, e.g. today, tomorrow, this_week, this_weekend')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((url: string, options: Cursor & { time?: string }) =>
      run(async () => (await getClient()).facebook.cityEvents({ url, ...options })),
    )

  facebook
    .command('events-search <query>')
    .description('Search Facebook events by keyword')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action((query: string, options: Cursor) =>
      run(async () => (await getClient()).facebook.eventsSearch({ query, ...options })),
    )

  facebook
    .command('event <url-or-id>')
    .description('Get Facebook event details by URL or event ID')
    .action((value: string) =>
      run(async () => (await getClient()).facebook.eventDetails(urlOrId(value, 'id'))),
    )

  facebook
    .command('marketplace-search <query>')
    .description('Search Facebook Marketplace listings near a location')
    .requiredOption('--lat <lat>', 'Latitude, e.g. 40.7128 (see marketplace-location)')
    .requiredOption('--lng <lng>', 'Longitude, e.g. -74.006 (see marketplace-location)')
    .option('--radius-km <km>', 'Search radius in kilometres')
    .option('--min-price <price>', 'Minimum price')
    .option('--max-price <price>', 'Maximum price')
    .option('--count <count>', 'Number of results')
    .option('--sort-by <sort>', 'Sort order')
    .option('--delivery-method <method>', 'Delivery method filter')
    .option('--condition <condition>', 'Item condition filter')
    .option('--date-listed <range>', 'Listing date filter')
    .option('--availability <availability>', 'Availability filter')
    .option('--cursor <cursor>', CURSOR_HELP)
    .action(
      (
        query: string,
        options: Cursor & {
          lat: string
          lng: string
          radiusKm?: string
          minPrice?: string
          maxPrice?: string
          count?: string
          sortBy?: string
          deliveryMethod?: string
          condition?: string
          dateListed?: string
          availability?: string
        },
      ) =>
        run(async () =>
          (await getClient()).facebook.marketplaceSearch({
            query,
            lat: options.lat,
            lng: options.lng,
            radius_km: options.radiusKm,
            min_price: options.minPrice,
            max_price: options.maxPrice,
            count: options.count,
            sort_by: options.sortBy,
            delivery_method: options.deliveryMethod,
            condition: options.condition,
            date_listed: options.dateListed,
            availability: options.availability,
            cursor: options.cursor,
          }),
        ),
    )

  facebook
    .command('marketplace-item <url-or-id>')
    .description('Get a Facebook Marketplace listing by URL or item ID')
    .action((value: string) =>
      run(async () => (await getClient()).facebook.marketplaceItem(urlOrId(value, 'id'))),
    )

  facebook
    .command('marketplace-location <query>')
    .description('Search Facebook Marketplace locations to get coordinates')
    .action((query: string) =>
      run(async () => (await getClient()).facebook.marketplaceLocationSearch({ query })),
    )

  facebook
    .command('ad <url-or-id>')
    .description('Get a Meta Ad Library ad by URL or ad ID')
    .option('--trim', 'Return a trimmed response')
    .option('--cache-max-age <age>', CACHE_HELP)
    .action((value: string, options: CacheOptions & { trim?: boolean }) =>
      run(async () =>
        (await getClient()).facebook.ad({
          ...urlOrId(value, 'id'),
          trim: options.trim,
          cache_max_age: options.cacheMaxAge,
        }),
      ),
    )

  facebook
    .command('ad-transcript <url-or-id>')
    .description('Get the transcript of a Meta Ad Library video ad by URL or ad ID')
    .option('--cache-max-age <age>', CACHE_HELP)
    .action((value: string, options: CacheOptions) =>
      run(async () =>
        (await getClient()).facebook.adTranscript({
          ...urlOrId(value, 'id'),
          cache_max_age: options.cacheMaxAge,
        }),
      ),
    )

  withAdFilters(
    facebook
      .command('ads-search <query>')
      .description('Search Meta Ad Library ads by keyword')
      .option('--search-type <type>', 'keyword_unordered or keyword_exact_phrase')
      .option('--ad-type <type>', 'all or political_and_issue_ads'),
  ).action(
    (query: string, options: AdFilters & { searchType?: string; adType?: string }) =>
      run(async () =>
        (await getClient()).facebook.adsSearch({
          query,
          search_type: options.searchType,
          ad_type: options.adType,
          ...adFilters(options),
        }),
      ),
  )

  withAdFilters(
    facebook
      .command('company-ads <page-id-or-name>')
      .description('Get Meta Ad Library ads for a company by numeric page ID or company name'),
  ).action((value: string, options: AdFilters) =>
    run(async () =>
      (await getClient()).facebook.companyAds({
        ...(/^\d+$/.test(value) ? { pageId: value } : { companyName: value }),
        ...adFilters(options),
      }),
    ),
  )

  facebook
    .command('companies-search <query>')
    .description('Search Meta Ad Library companies by name')
    .action((query: string) =>
      run(async () => (await getClient()).facebook.companiesSearch({ query })),
    )
}
