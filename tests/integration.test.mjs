import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'
import { commands } from './helpers/commands.mjs'
import { pagination } from './helpers/pagination.mjs'
import { fixture } from './helpers/cli.mjs'

for (const entry of commands) {
  test(`${entry.args.slice(0, 2).join(' ')}: real binary, SDK request and JSON output`, async (t) => {
    const f = await fixture(t)
    const result = await f.run(entry.args)
    assert.equal(result.code, 0, result.stderr)
    assert.equal(result.stderr, '')
    assert.equal(result.stdout, `${JSON.stringify(f.response.body)}\n`)
    assert.equal(f.requests.length, 1)
    const request = f.requests[0]
    assert.equal(request.method, entry.method)
    assert.equal(request.url.pathname, entry.path)
    if (entry.method === 'POST') {
      assert.deepEqual(Object.fromEntries(request.url.searchParams), {})
      assert.deepEqual(JSON.parse(request.body), entry.query)
    } else {
      assert.deepEqual(Object.fromEntries(request.url.searchParams), entry.query)
    }
    assert.equal(request.headers['x-api-key'], 'fixture-key')
    assert.equal(request.headers.authorization, undefined)

    await t.test('pretty JSON retains the full response and pagination', async () => {
      const pretty = await f.run([...entry.args, '--pretty'])
      assert.equal(pretty.code, 0, pretty.stderr)
      assert.equal(pretty.stdout, `${JSON.stringify(f.response.body, null, 2)}\n`)
    })
    for (const status of [401, 402, 403, 429, 502, 503]) {
      await t.test(`HTTP ${status} exits nonzero with the API message on stderr`, async () => {
        f.response.status = status
        f.response.body = {
          error: {
            code: status === 403 ? 'upstream_forbidden' : 'test_failure',
            message: `Request failed (${status})`,
          },
        }
        const failure = await f.run(entry.args)
        assert.equal(failure.code, 1)
        assert.equal(failure.stdout, '')
        assert.match(failure.stderr, new RegExp(`Error ${status}: Request failed \\(${status}\\)`))
      })
    }
    await t.test('missing credentials fail before HTTP', async () => {
      f.requests.length = 0
      const missing = await f.run(entry.args, { CREATORCRAWL_API_KEY: '' })
      assert.equal(missing.code, 1)
      assert.match(missing.stderr, /authentication required/)
      assert.equal(f.requests.length, 0)
    })
    if (entry.required) {
      await t.test('missing required arguments fail before HTTP', async () => {
        f.requests.length = 0
        const missing = await f.run(entry.args.slice(0, -1))
        assert.equal(missing.code, 1)
        assert.match(missing.stderr, /missing required argument/)
        assert.equal(f.requests.length, 0)
      })
    }
  })
}

test('the command matrix covers every advertised data command', async (t) => {
  const f = await fixture(t)
  for (const platform of [
    'tiktok',
    'instagram',
    'youtube',
    'linkedin',
    'twitter',
    'reddit',
    'facebook',
  ]) {
    const help = await f.run([platform, '--help'])
    assert.equal(help.code, 0)
    const names = [...help.stdout.split('Commands:')[1].matchAll(/^  ([a-z][a-z-]*)\b/gm)]
      .map((match) => match[1])
      .filter((name) => name !== 'help')
      .sort()
    assert.deepEqual(
      names,
      commands
        .filter((entry) => entry.args[0] === platform)
        .map((entry) => entry.args[1])
        .filter((name, index, names) => names.indexOf(name) === index)
        .sort(),
    )
  }
})

test('API-key precedence and OAuth credentials stay out of output', async (t) => {
  const f = await fixture(t)
  await f.credentials({ type: 'api-key', apiKey: 'stored-key' })
  for (const [args, env, key] of [
    [['tiktok', 'profile', 'test'], { CREATORCRAWL_API_KEY: '' }, 'stored-key'],
    [['tiktok', 'profile', 'test'], {}, 'fixture-key'],
    [['--api-key', 'explicit-key', 'tiktok', 'profile', 'test'], {}, 'explicit-key'],
  ]) {
    const result = await f.run(args, env)
    assert.equal(result.code, 0, result.stderr)
    assert.equal(f.requests.at(-1).headers['x-api-key'], key)
    assert.ok(!`${result.stdout}${result.stderr}`.includes(key))
  }
  await f.credentials({
    type: 'oauth',
    clientId: 'test-client',
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    expiresAt: Date.now() + 3600000,
  })
  const result = await f.run(['tiktok', 'profile', 'test'], { CREATORCRAWL_API_KEY: '' })
  assert.equal(result.code, 0, result.stderr)
  assert.equal(f.requests.at(-1).headers.authorization, 'Bearer test-access')
  assert.equal(f.requests.at(-1).headers['x-api-key'], undefined)
  assert.ok(!`${result.stdout}${result.stderr}`.includes('test-access'))
})

test('malformed API success responses fail instead of printing success', async (t) => {
  const f = await fixture(t)
  for (const body of ['<html>Bad gateway</html>', null, {}, []]) {
    f.response.body = body
    const result = await f.run(['tiktok', 'profile', 'test'])
    assert.equal(result.code, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /invalid response/i)
  }
})

for (const [platform, command, flag, parameter] of pagination) {
  test(`${platform} ${command}: --${flag} collects distinct pages without losing cursors`, async (t) => {
    const f = await fixture(t)
    const entry = commands.find((entry) => entry.args[0] === platform && entry.args[1] === command)
    const token = flag === 'page' ? '2' : platform === 'tiktok' ? '1734562353000' : 'next +/&雪'
    f.response.body.page.cursor = token
    const first = await f.run(entry.args)
    assert.equal(first.code, 0, first.stderr)
    const nextCursor = JSON.parse(first.stdout).page.cursor
    f.response.body = {
      data: [{ id: 'second' }],
      page: { cursor: null, has_more: false },
      meta: { platform },
    }
    const second = await f.run([...entry.args, `--${flag}`, nextCursor])
    assert.equal(second.code, 0, second.stderr)
    assert.notDeepEqual(JSON.parse(first.stdout).data, JSON.parse(second.stdout).data)
    assert.equal(JSON.parse(second.stdout).page.has_more, false)
    assert.equal(f.requests.length, 2)
    assert.equal(f.requests[1].url.pathname, entry.path)
    assert.deepEqual(Object.fromEntries(f.requests[1].url.searchParams), {
      ...entry.query,
      [parameter]: token,
    })
  })
}

test('facebook ads-search sends filters and long cursors in a POST body', async (t) => {
  const f = await fixture(t)
  const cursor = 'A'.repeat(4000)
  const result = await f.run([
    'facebook',
    'ads-search',
    'nike',
    '--country',
    'US',
    '--trim',
    '--cursor',
    cursor,
  ])
  assert.equal(result.code, 0, result.stderr)
  assert.equal(f.requests[0].method, 'POST')
  assert.equal(f.requests[0].headers['content-type'], 'application/json')
  assert.deepEqual(JSON.parse(f.requests[0].body), {
    query: 'nike',
    country: 'US',
    cursor,
    trim: true,
  })
})

test('invalid API key exits 1 with the API message and a login hint', async (t) => {
  const f = await fixture(t)
  f.response.status = 401
  f.response.body = { success: false, error: 'Invalid API key' }
  const result = await f.run(['facebook', 'profile', 'https://www.facebook.com/nike'])
  assert.equal(result.code, 1)
  assert.equal(result.stdout, '')
  assert.equal(
    result.stderr,
    'Error 401: Invalid API key\nCheck your API key or run creatorcrawl auth login.\n',
  )
})

test('expired OAuth refreshes once, persists rotated credentials and sends the new bearer token', async (t) => {
  const f = await fixture(t)
  await f.credentials({
    type: 'oauth',
    clientId: 'test-client',
    accessToken: 'expired',
    refreshToken: 'old-refresh',
    expiresAt: 1,
  })
  const envelope = f.response.body
  f.response.handler = (request) =>
    request.url.pathname === '/oauth/token'
      ? {
          status: 200,
          body: { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 },
        }
      : { status: 200, body: envelope }
  const result = await f.run(['tiktok', 'profile', 'test'], { CREATORCRAWL_API_KEY: '' })
  assert.equal(result.code, 0, result.stderr)
  assert.equal(f.requests.length, 2)
  assert.equal(f.requests[0].method, 'POST')
  assert.deepEqual(Object.fromEntries(new URLSearchParams(f.requests[0].body)), {
    grant_type: 'refresh_token',
    client_id: 'test-client',
    refresh_token: 'old-refresh',
  })
  assert.equal(f.requests[1].headers.authorization, 'Bearer new-access')
  const saved = JSON.parse(await readFile(f.credentialsPath, 'utf8'))
  assert.equal(saved.accessToken, 'new-access')
  assert.equal(saved.refreshToken, 'new-refresh')
  assert.ok(saved.expiresAt > Date.now())
  if (process.platform !== 'win32')
    assert.equal((await stat(f.credentialsPath)).mode & 0o777, 0o600)
})

test('failed or malformed OAuth refresh preserves credentials and never calls data endpoints', async (t) => {
  const f = await fixture(t)
  const stored = {
    type: 'oauth',
    clientId: 'test-client',
    accessToken: 'expired',
    refreshToken: 'old-refresh',
    expiresAt: 1,
  }
  for (const response of [
    { status: 400, body: { error: 'invalid_grant' } },
    { status: 200, body: {} },
    {
      status: 200,
      body: { access_token: 'new', refresh_token: 'new', expires_in: 'not-a-number' },
    },
  ]) {
    await f.credentials(stored)
    f.requests.length = 0
    Object.assign(f.response, response)
    const result = await f.run(['tiktok', 'profile', 'test'], { CREATORCRAWL_API_KEY: '' })
    assert.equal(result.code, 1)
    assert.equal(result.stdout, '')
    assert.equal(f.requests.length, 1)
    assert.equal(f.requests[0].url.pathname, '/oauth/token')
    assert.deepEqual(JSON.parse(await readFile(f.credentialsPath, 'utf8')), stored)
  }
})

test('auth status and logout use only isolated test credentials', async (t) => {
  const f = await fixture(t)
  await f.credentials({
    type: 'oauth',
    clientId: 'test-client',
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: Date.now() + 3600000,
  })
  const status = await f.run(['auth', 'status', '--json'], { CREATORCRAWL_API_KEY: '' })
  assert.equal(status.code, 0, status.stderr)
  assert.deepEqual(JSON.parse(status.stdout), { authenticated: true, source: 'oauth' })
  assert.equal(f.requests[0].url.pathname, '/validate-key')
  const logout = await f.run(['auth', 'logout'], { CREATORCRAWL_API_KEY: '' })
  assert.equal(logout.code, 0, logout.stderr)
  assert.equal(f.requests[1].url.pathname, '/oauth/revoke')
  assert.equal(f.requests[1].method, 'POST')
  assert.deepEqual(Object.fromEntries(new URLSearchParams(f.requests[1].body)), {
    token: 'refresh',
    client_id: 'test-client',
  })
  await assert.rejects(readFile(f.credentialsPath), { code: 'ENOENT' })
})

test('connection failures and unknown flags are nonzero errors without stdout', async (t) => {
  const f = await fixture(t)
  f.response.disconnect = true
  const network = await f.run(['tiktok', 'profile', 'test'])
  assert.equal(network.code, 1)
  assert.equal(network.stdout, '')
  assert.match(network.stderr, /fetch failed/)
  f.requests.length = 0
  const unknown = await f.run(['tiktok', 'profile', 'test', '--not-a-flag'])
  assert.equal(unknown.code, 1)
  assert.equal(unknown.stdout, '')
  assert.equal(f.requests.length, 0)
})

test('TikTok video sorting and profile URL normalization reach the API', async (t) => {
  const f = await fixture(t)
  for (const sort of ['latest', 'popular']) {
    const result = await f.run([
      'tiktok',
      'videos',
      'https://www.tiktok.com/@luketriestech?lang=en',
      '--sort',
      sort,
      '--cursor',
      '1734562353000',
    ])
    assert.equal(result.code, 0, result.stderr)
    assert.deepEqual(Object.fromEntries(f.requests.at(-1).url.searchParams), {
      handle: 'luketriestech',
      sort_by: sort,
      max_cursor: '1734562353000',
    })
  }
  f.requests.length = 0
  for (const input of ['@', '', 'https://example.com/@test', 'https://tiktok.com/']) {
    const result = await f.run(['tiktok', 'profile', input])
    assert.equal(result.code, 1)
    assert.equal(f.requests.length, 0)
  }
  const result = await f.run(['tiktok', 'videos', 'test', '--sort', 'invalid'])
  assert.equal(result.code, 1)
  assert.equal(f.requests.length, 0)
})

test('page flags reject malformed numbers before requesting the API', async (t) => {
  const f = await fixture(t)
  for (const [platform, command] of pagination.filter(([, , flag]) => flag === 'page')) {
    const entry = commands.find((entry) => entry.args[0] === platform && entry.args[1] === command)
    for (const value of ['0', '-1', '1.5', 'abc', '9007199254740993']) {
      const result = await f.run([...entry.args, '--page', value])
      assert.equal(result.code, 1)
      assert.match(result.stderr, /positive integer/)
    }
  }
  assert.equal(f.requests.length, 0)
})
