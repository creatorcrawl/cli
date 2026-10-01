const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { EventEmitter } = require('node:events')
const childProcess = require('node:child_process')
const networkFetch = global.fetch
let authorization

childProcess.spawnSync = () => ({ status: 1 })
childProcess.spawn = (_command, args) => {
  const url = args.find((arg) => arg.startsWith('https://app.creatorcrawl.com/api/oauth/authorize?'))
  assert.ok(url, 'browser opens the CreatorCrawl authorization link')
  authorization = new URL(url)
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(authorization.searchParams.get('scope'), 'api offline_access')
  const callback = new URL(authorization.searchParams.get('redirect_uri'))
  callback.searchParams.set('state', authorization.searchParams.get('state'))
  callback.searchParams.set('code', 'test-auth-code')
  setTimeout(() => networkFetch(callback).catch((error) => {
    console.error(error)
    process.exitCode = 1
  }), 10)
  const child = new EventEmitter()
  child.unref = () => {}
  return child
}

global.fetch = async (input, options) => {
  const url = new URL(input)
  assert.equal(url.origin, 'https://app.creatorcrawl.com')
  if (url.pathname === '/api/oauth/register') {
    const registration = JSON.parse(options.body)
    assert.equal(registration.token_endpoint_auth_method, 'none')
    assert.equal(registration.scope, 'api offline_access')
    assert.match(registration.redirect_uris[0], /^http:\/\/127\.0\.0\.1:\d+\/callback$/)
    return Response.json({ client_id: 'test-client' }, { status: 201 })
  }
  assert.equal(url.pathname, '/api/oauth/token')
  const body = options.body
  assert.equal(body.get('grant_type'), 'authorization_code')
  assert.equal(body.get('code'), 'test-auth-code')
  assert.equal(body.get('client_id'), 'test-client')
  assert.equal(createHash('sha256').update(body.get('code_verifier')).digest('base64url'), authorization.searchParams.get('code_challenge'))
  return Response.json({ access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600 })
}
