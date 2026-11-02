import type { CreatorCrawl } from '@creatorcrawl/sdk'
import type { Command } from 'commander'
import { run } from '../index'
import { parsePage } from '../options'

export function registerLinkedIn(program: Command, getClient: () => Promise<CreatorCrawl>): void {
  const linkedin = program.command('linkedin').description('LinkedIn endpoints')

  linkedin
    .command('profile <url>')
    .description('Get LinkedIn person profile by URL')
    .action((url: string) => run(async () => (await getClient()).linkedin.profile({ url })))

  linkedin
    .command('company <url>')
    .description('Get LinkedIn company page by URL')
    .action((url: string) => run(async () => (await getClient()).linkedin.company({ url })))

  linkedin
    .command('company-posts <url>')
    .description('Get recent posts from a LinkedIn company page')
    .option('--page <page>', 'Page number from page.cursor in the previous response', parsePage)
    .action((url: string, options: { page?: string }) =>
      run(async () => (await getClient()).linkedin.companyPosts({ ...options, url })),
    )

  linkedin
    .command('post <url>')
    .description('Get info for a single LinkedIn post')
    .action((url: string) => run(async () => (await getClient()).linkedin.post({ url })))

  linkedin
    .command('ads <keyword>')
    .description('Search the LinkedIn Ad Library by keyword (or pass a company name)')
    .option('--cursor <cursor>', 'Cursor from page.cursor in the previous response')
    .action((keyword: string, options: { cursor?: string }) =>
      run(async () =>
        (await getClient()).linkedin.adsSearch({ paginationToken: options.cursor, keyword }),
      ),
    )

  linkedin
    .command('ad <url>')
    .description('Get info for a single LinkedIn ad')
    .action((url: string) => run(async () => (await getClient()).linkedin.ad({ url })))

  for (const spec of linkedinCommands) registerLinkedInCommand(linkedin, spec, getClient)
}

type OptionKind = 'value' | 'page' | 'flag'
type LinkedInOption = readonly [name: string, help: string, kind?: OptionKind]
type LinkedInCommand = {
  name: string
  path: string
  description: string
  argument?: string
  urlOrId?: string
  options?: readonly LinkedInOption[]
}

const PAGE: LinkedInOption = ['page', 'Page number, starting at 1', 'page']
const PAGE_100: LinkedInOption = ['page', 'Page number, starting at 1 (max 100)', 'page']
const PAGINATION_TOKEN: LinkedInOption = [
  'paginationToken',
  'Pagination token from the previous page; send it with the next page number when returned',
]
const GEO_ID: LinkedInOption = [
  'geoId',
  'LinkedIn Geo ID; overrides location. Find IDs with linkedin search-location',
]
const INDUSTRY_ID: LinkedInOption = ['industryId', 'LinkedIn industry ID, or several comma-separated']
const POSTED_LIMIT: LinkedInOption = ['postedLimit', 'Only posts from the last: 24h, week, or month']
const SCRAPE_POSTED_LIMIT: LinkedInOption = [
  'scrapePostedLimit',
  'Drop posts older than: 1h, 24h, week, month, 3months, 6months, or year',
]
const SORT_BY: LinkedInOption = ['sortBy', 'relevance or date']
const HEADCOUNT_BANDS =
  '1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+'

const linkedinCommands: readonly LinkedInCommand[] = [
  {
    name: 'search-people',
    path: '/linkedin/search/people',
    description:
      'Search LinkedIn people by name, title, current or past company, school, location, and industry',
    options: [
      ['search', 'Name or keywords to search for'],
      ['title', 'Job title'],
      ['firstName', 'First name'],
      ['lastName', 'Last name'],
      ['currentCompany', 'Current company URL or ID, or several comma-separated'],
      ['pastCompany', 'Past company URL or ID, or several comma-separated'],
      ['school', 'School URL or ID, or several comma-separated'],
      ['location', 'Location text, e.g. London'],
      GEO_ID,
      INDUSTRY_ID,
      ['keywordsCompany', 'Keywords in the company name'],
      ['keywordsSchool', 'Keywords in the school name'],
      ['followerOf', 'Profile URL or ID; returns people who follow that profile'],
      PAGE,
    ],
  },
  {
    name: 'profile-by-email',
    path: '/linkedin/profile/by-email',
    description: 'Find the LinkedIn profile behind a work email address',
    argument: 'email',
  },
  {
    name: 'profile-email',
    path: '/linkedin/profile/email',
    description: 'Get a full LinkedIn profile plus its SMTP-verified work email',
    argument: 'query',
  },
  {
    name: 'profile-posts',
    path: '/linkedin/profile/posts',
    description: 'Get the posts published by a LinkedIn member, newest first',
    argument: 'profile',
    options: [POSTED_LIMIT, SCRAPE_POSTED_LIMIT, PAGE, PAGINATION_TOKEN],
  },
  {
    name: 'profile-comments',
    path: '/linkedin/profile/comments',
    description: 'Get the comments a LinkedIn member has left on posts',
    argument: 'profile',
    options: [POSTED_LIMIT, PAGE, PAGINATION_TOKEN],
  },
  {
    name: 'profile-reactions',
    path: '/linkedin/profile/reactions',
    description: 'Get the posts a LinkedIn member has reacted to',
    argument: 'profile',
    options: [PAGE, PAGINATION_TOKEN],
  },
  {
    name: 'search-companies',
    path: '/linkedin/search/companies',
    description: 'Search LinkedIn company pages by name, location, size, and industry',
    options: [
      ['search', 'Keywords in the company name'],
      ['location', 'Location text'],
      GEO_ID,
      ['companySize', `Headcount band, or several comma-separated: ${HEADCOUNT_BANDS}`],
      INDUSTRY_ID,
      PAGE,
    ],
  },
  {
    name: 'company-people-stats',
    path: '/linkedin/company/people-stats',
    description:
      'Get where employees of a LinkedIn company live, where they studied, what they do, and their skills',
    argument: 'query',
  },
  {
    name: 'company-insights',
    path: '/linkedin/company/insights',
    description:
      'Get account insights for a LinkedIn company: revenue, AI summaries, key people, headcount and hiring charts, job openings, and alerts',
    argument: 'query',
  },
  {
    name: 'search-accounts',
    path: '/linkedin/search/accounts',
    description:
      'Sales Navigator style company search by headcount and growth, revenue, department headcount, hiring, activity, and Fortune rank',
    options: [
      ['search', 'Search query; supports LinkedIn search operators'],
      ['headquarterLocations', 'Headquarters locations, comma-separated'],
      ['headquarterGeoIds', 'Headquarters Geo IDs, comma-separated'],
      ['industryIds', 'Industry IDs, comma-separated'],
      ['companyHeadcount', `Headcount bands, comma-separated: ${HEADCOUNT_BANDS}`],
      ['companyHeadcountGrowth', 'Headcount growth percent as min-max, e.g. 1-100'],
      ['annualRevenue', 'Annual revenue in millions as min-max;currency, e.g. 1-10;USD'],
      ['numOfFollowers', 'Follower bands, comma-separated: 1-50, 51-100, 101-1000, 1001-5000, 5001+'],
      ['departmentHeadcount', 'Department headcount as min-max;department, e.g. 10-100;Engineering'],
      [
        'departmentHeadcountGrowth',
        'Department headcount growth percent as min-max;department, e.g. 5-50;Sales',
      ],
      ['jobOpportunities', 'Set HIRING_ON_LINKEDIN to find companies hiring on LinkedIn'],
      [
        'accountActivities',
        'Comma-separated: SENIOR_LEADERSHIP_CHANGES_LAST_3_MONTHS, FUNDING_EVENTS_PAST_12_MONTHS',
      ],
      ['fortune', 'Fortune rank bands, comma-separated: 50, 51_100, 101_250, 251_500'],
      ['excludeHeadquarterLocations', 'Headquarters locations to exclude, comma-separated'],
      ['excludeHeadquarterGeoIds', 'Headquarters Geo IDs to exclude, comma-separated'],
      ['excludeIndustryIds', 'Industry IDs to exclude, comma-separated'],
      ['excludeCompanyHeadcount', 'Headcount bands to exclude, comma-separated'],
      PAGE_100,
    ],
  },
  {
    name: 'search-leads',
    path: '/linkedin/search/leads',
    description:
      'Sales Navigator style people search with inclusion and exclusion filters, or a Sales Navigator search URL',
    options: [
      ['search', 'Search query; supports LinkedIn search operators'],
      ['currentCompanies', 'Current company URLs or IDs, comma-separated'],
      ['pastCompanies', 'Past company URLs or IDs, comma-separated'],
      ['currentJobTitles', 'Current job titles, comma-separated'],
      ['pastJobTitles', 'Past job titles, comma-separated'],
      ['firstNames', 'First names, comma-separated'],
      ['lastNames', 'Last names, comma-separated'],
      ['locations', 'Locations, comma-separated'],
      ['geoIds', 'Geo IDs, comma-separated; overrides locations'],
      ['schools', 'School URLs or IDs, comma-separated'],
      ['industryIds', 'Industry IDs, comma-separated'],
      ['seniorityLevelIds', 'Seniority level IDs, comma-separated'],
      ['functionIds', 'Job function IDs, comma-separated'],
      ['yearsAtCurrentCompanyIds', 'Years-at-current-company IDs, comma-separated'],
      ['yearsOfExperienceIds', 'Years-of-experience IDs, comma-separated'],
      ['companyHeadcount', 'Company headcount bands, comma-separated'],
      ['companyHeadquarterLocations', 'Company headquarters locations, comma-separated'],
      ['profileLanguages', 'Profile languages, comma-separated'],
      ['recentlyChangedJobs', 'Only people who changed jobs in the last 90 days', 'flag'],
      ['postedOnLinkedin', 'Only people who posted in the last 30 days', 'flag'],
      ['excludeLocations', 'Locations to exclude, comma-separated'],
      ['excludeGeoIds', 'Geo IDs to exclude, comma-separated'],
      ['excludeCurrentCompanies', 'Current companies to exclude, comma-separated'],
      ['excludePastCompanies', 'Past companies to exclude, comma-separated'],
      ['excludeSchools', 'Schools to exclude, comma-separated'],
      ['excludeCurrentJobTitles', 'Current job titles to exclude, comma-separated'],
      ['excludePastJobTitles', 'Past job titles to exclude, comma-separated'],
      ['excludeIndustryIds', 'Industry IDs to exclude, comma-separated'],
      ['excludeSeniorityLevelIds', 'Seniority level IDs to exclude, comma-separated'],
      ['excludeFunctionIds', 'Function IDs to exclude, comma-separated'],
      [
        'excludeCompanyHeadquarterLocations',
        'Company headquarters locations to exclude, comma-separated',
      ],
      ['salesNavUrl', 'Sales Navigator search URL; overrides every filter except page'],
      PAGE_100,
    ],
  },
  {
    name: 'job',
    path: '/linkedin/job',
    description: 'Get a LinkedIn job posting by URL or job ID',
    urlOrId: 'jobId',
  },
  {
    name: 'search-jobs',
    path: '/linkedin/search/jobs',
    description:
      'Search LinkedIn jobs by title, company, location, workplace type, employment type, salary, experience level, and date posted',
    options: [
      ['search', 'Job title or keywords'],
      ['companyId', 'Company ID, or several comma-separated'],
      ['location', 'Location text'],
      GEO_ID,
      SORT_BY,
      ['workplaceType', 'Comma-separated: office, hybrid, remote'],
      ['employmentType', 'Comma-separated: full-time, part-time, contract, temporary, internship'],
      ['salary', 'Minimum salary: 40k+, 60k+, 80k+, 100k+, 120k+, 140k+, 160k+, 180k+, 200k+'],
      ['postedLimit', 'Posted within: 24h, week, or month'],
      [
        'experienceLevel',
        'Comma-separated: internship, entry, associate, mid-senior, director, executive',
      ],
      INDUSTRY_ID,
      ['functionId', 'Job function ID, or several comma-separated'],
      ['under10Applicants', 'Only jobs with fewer than 10 applicants', 'flag'],
      ['easyApply', 'true for Easy Apply jobs only, false to exclude them'],
      PAGE,
    ],
  },
  {
    name: 'search-location',
    path: '/linkedin/search/location',
    description: 'Resolve location text to LinkedIn Geo IDs for --geo-id filters',
    argument: 'search',
  },
  {
    name: 'search-posts',
    path: '/linkedin/search/posts',
    description:
      'Search LinkedIn posts by keyword, author, company, mentions, group, content type, and date',
    options: [
      ['search', 'Keywords in the post'],
      ['profile', 'Author profile URLs, public identifiers, or IDs, comma-separated'],
      ['company', 'Author company URLs or IDs, comma-separated'],
      ['authorsCompany', 'Companies where authors work, comma-separated URLs or IDs'],
      ['authorsIndustryId', 'Industry IDs of authors\u2019 companies, comma-separated'],
      ['authorKeywords', 'Keywords in author profiles'],
      ['mentioningMember', 'Profile URLs or IDs mentioned in the post, comma-separated'],
      ['mentioningCompany', 'Company URLs or IDs mentioned in the post, comma-separated'],
      ['contentType', 'videos, images, live_videos, documents, collaborative_articles, or jobs'],
      ['group', 'LinkedIn group URL or ID'],
      POSTED_LIMIT,
      SCRAPE_POSTED_LIMIT,
      SORT_BY,
      PAGE,
      PAGINATION_TOKEN,
    ],
  },
  {
    name: 'post-comments',
    path: '/linkedin/post/comments',
    description: 'Get the comments on a LinkedIn post',
    argument: 'post',
    options: [
      SORT_BY,
      PAGE,
      ['paginationToken', 'Token from the previous page; needed for relevance pages after 1'],
    ],
  },
  {
    name: 'comment-replies',
    path: '/linkedin/post/comments/replies',
    description: 'Get the replies to a LinkedIn comment',
    argument: 'url',
    options: [PAGINATION_TOKEN],
  },
  {
    name: 'post-reactions',
    path: '/linkedin/post/reactions',
    description: 'Get the people who reacted to a LinkedIn post, with reaction type',
    argument: 'post',
    options: [PAGE],
  },
  {
    name: 'comment-reactions',
    path: '/linkedin/post/comments/reactions',
    description: 'Get the people who reacted to a LinkedIn comment',
    argument: 'url',
    options: [PAGE],
  },
  {
    name: 'group',
    path: '/linkedin/group',
    description: 'Get a LinkedIn group by URL or group ID',
    urlOrId: 'groupId',
  },
  {
    name: 'search-groups',
    path: '/linkedin/search/groups',
    description: 'Search LinkedIn groups by keyword',
    argument: 'search',
    options: [PAGE],
  },
  {
    name: 'search-services',
    path: '/linkedin/search/services',
    description: 'Search LinkedIn service pages (freelancers and agencies) by keyword and location',
    argument: 'search',
    options: [['location', 'Location text'], GEO_ID, PAGE],
  },
]

const ARGUMENT_LABELS: Record<string, string> = {
  email: 'email',
  query: 'url-or-id',
  profile: 'profile',
  post: 'post-url',
  url: 'comment-url',
  search: 'query',
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function registerLinkedInCommand(
  linkedin: Command,
  spec: LinkedInCommand,
  getClient: () => Promise<CreatorCrawl>,
): void {
  const label = spec.urlOrId ? 'url-or-id' : spec.argument && ARGUMENT_LABELS[spec.argument]
  const command = linkedin
    .command(label ? `${spec.name} <${label}>` : spec.name)
    .description(spec.description)
  for (const [name, help, kind = 'value'] of spec.options ?? []) {
    if (kind === 'flag') command.option(`--${kebab(name)}`, help)
    else if (kind === 'page') command.option(`--${kebab(name)} <page>`, help, parsePage)
    else command.option(`--${kebab(name)} <value>`, help)
  }
  command.action((...args: unknown[]) => {
    const options = (label ? args[1] : args[0]) as Record<string, string | boolean | undefined>
    const value = args[0] as string
    const positional = spec.urlOrId
      ? urlOrId(value, spec.urlOrId)
      : spec.argument
        ? { [spec.argument]: value }
        : {}
    return run(async () => (await getClient()).get(spec.path, { ...options, ...positional }))
  })
}

function urlOrId(value: string, idKey: string): Record<string, string> {
  return /^https?:\/\//i.test(value) ? { url: value } : { [idKey]: value }
}
