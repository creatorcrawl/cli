import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

test('browser login exchanges PKCE code and saves refreshable credentials without an API key', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'creatorcrawl-oauth-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const output = execFileSync(process.execPath, [
    '--require', fileURLToPath(new URL('./oauth-browser.cjs', import.meta.url)),
    fileURLToPath(new URL('../dist/index.cjs', import.meta.url)),
    'auth', 'login',
  ], { env: { ...process.env, XDG_CONFIG_HOME: directory, CREATORCRAWL_API_KEY: '' }, encoding: 'utf8', timeout: 10000 })
  assert.match(output, /https:\/\/app\.creatorcrawl\.com\/api\/oauth\/authorize/)
  assert.match(output, /OAuth authentication saved securely/)
  const credentials = JSON.parse(readFileSync(join(directory, 'creatorcrawl/credentials.json'), 'utf8'))
  assert.equal(credentials.type, 'oauth')
  assert.equal(credentials.accessToken, 'test-access')
  assert.equal(credentials.refreshToken, 'test-refresh')
  assert.ok(credentials.expiresAt > Date.now())
})
