import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import type { AddressInfo } from 'node:net'
import type { Command } from 'commander'

const APP_URL = 'https://app.creatorcrawl.com'
const KEYCHAIN_SERVICE = 'creatorcrawl-cli'
const KEYCHAIN_ACCOUNT = 'oauth'

interface ApiKeyCredentials {
  type: 'api-key'
  apiKey: string
}

interface OAuthCredentials {
  type: 'oauth'
  clientId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

type Credentials = ApiKeyCredentials | OAuthCredentials

export interface ResolvedCredential {
  apiKey?: string
  accessToken?: string
  source: 'environment' | 'stored-api-key' | 'oauth'
}

function credentialsPath(): string {
  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')
  return join(configHome, 'creatorcrawl', 'credentials.json')
}

function keychainAvailable(): boolean {
  return process.platform === 'darwin' && spawnSync('security', ['help'], { stdio: 'ignore' }).status === 0
}

function readCredentials(): Credentials | undefined {
  if (keychainAvailable()) {
    const result = spawnSync(
      'security',
      ['find-generic-password', '-a', KEYCHAIN_ACCOUNT, '-s', KEYCHAIN_SERVICE, '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    if (result.status === 0 && result.stdout.trim()) {
      return JSON.parse(result.stdout.trim()) as Credentials
    }
  }
  try {
    return JSON.parse(readFileSync(credentialsPath(), 'utf8')) as Credentials
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

async function saveCredentials(credentials: Credentials): Promise<void> {
  if (keychainAvailable()) {
    const result = spawnSync(
      'security',
      [
        'add-generic-password',
        '-U',
        '-a',
        KEYCHAIN_ACCOUNT,
        '-s',
        KEYCHAIN_SERVICE,
        '-w',
        JSON.stringify(credentials),
      ],
      { stdio: 'ignore' },
    )
    if (result.status !== 0) throw new Error('Could not save authentication in macOS Keychain.')
    await rm(credentialsPath(), { force: true })
    return
  }
  const path = credentialsPath()
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(path, `${JSON.stringify(credentials)}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
}

async function removeCredentials(): Promise<void> {
  if (keychainAvailable()) {
    spawnSync(
      'security',
      ['delete-generic-password', '-a', KEYCHAIN_ACCOUNT, '-s', KEYCHAIN_SERVICE],
      { stdio: 'ignore' },
    )
  }
  await rm(credentialsPath(), { force: true })
}

async function revokeOAuth(credentials: OAuthCredentials): Promise<void> {
  await fetch(`${APP_URL}/api/oauth/revoke`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: credentials.refreshToken,
      client_id: credentials.clientId,
    }),
  })
}

function openBrowser(url: string): void {
  const command =
    process.platform === 'darwin'
      ? ['open', url]
      : process.platform === 'win32'
        ? ['cmd', '/c', 'start', '', url]
        : ['xdg-open', url]
  const child = spawn(command[0], command.slice(1), { detached: true, stdio: 'ignore' })
  child.on('error', () => undefined)
  child.unref()
}

function base64Url(input: Buffer): string {
  return input.toString('base64url')
}

async function oauthRequest(path: string, body: URLSearchParams | Record<string, unknown>) {
  const isForm = body instanceof URLSearchParams
  const response = await fetch(`${APP_URL}/api${path}`, {
    method: 'POST',
    headers: { 'content-type': isForm ? 'application/x-www-form-urlencoded' : 'application/json' },
    body: isForm ? body : JSON.stringify(body),
  })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(String(data.error_description ?? data.error ?? `OAuth request failed (${response.status})`))
  }
  return data
}

async function browserLogin(): Promise<OAuthCredentials> {
  const callback = createServer()
  await new Promise<void>((resolve, reject) => {
    callback.once('error', reject)
    callback.listen(0, '127.0.0.1', resolve)
  })
  const port = (callback.address() as AddressInfo).port
  const redirectUri = `http://127.0.0.1:${port}/callback`
  const registration = await oauthRequest('/oauth/register', {
    client_name: 'CreatorCrawl CLI',
    redirect_uris: [redirectUri],
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: 'api offline_access',
  })
  const clientId = String(registration.client_id)
  const verifier = base64Url(randomBytes(48))
  const challenge = base64Url(createHash('sha256').update(verifier).digest())
  const state = base64Url(randomBytes(24))
  const authorizeUrl = new URL(`${APP_URL}/api/oauth/authorize`)
  authorizeUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'api offline_access',
    state,
  }).toString()

  const codePromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      callback.close()
      reject(new Error('OAuth login timed out.'))
    }, 5 * 60 * 1000)
    callback.on('request', (request, response) => {
      const url = new URL(request.url ?? '/', redirectUri)
      if (url.pathname !== '/callback') {
        response.writeHead(404).end()
        return
      }
      clearTimeout(timeout)
      response.setHeader('content-type', 'text/html; charset=utf-8')
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')
      const code = url.searchParams.get('code')
      if (returnedState !== state || error || !code) {
        response.end('<h1>CreatorCrawl authorization failed</h1><p>You can close this window.</p>')
        callback.close()
        reject(new Error(error ?? 'Invalid OAuth callback.'))
        return
      }
      response.end('<h1>CreatorCrawl CLI authorized</h1><p>You can close this window.</p>')
      callback.close()
      resolve(code)
    })
  })

  console.log('Opening CreatorCrawl in your browser...')
  console.log(`If it does not open, visit:\n${authorizeUrl.toString()}`)
  openBrowser(authorizeUrl.toString())
  const code = await codePromise
  const token = await oauthRequest(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  )
  return {
    type: 'oauth',
    clientId,
    accessToken: String(token.access_token),
    refreshToken: String(token.refresh_token),
    expiresAt: Date.now() + Number(token.expires_in) * 1000,
  }
}

async function refreshOAuth(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  const token = await oauthRequest(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: credentials.clientId,
      refresh_token: credentials.refreshToken,
    }),
  )
  const refreshed: OAuthCredentials = {
    ...credentials,
    accessToken: String(token.access_token),
    refreshToken: String(token.refresh_token),
    expiresAt: Date.now() + Number(token.expires_in) * 1000,
  }
  await saveCredentials(refreshed)
  return refreshed
}

async function verifyCredential(credential: ResolvedCredential): Promise<boolean> {
  const headers: Record<string, string> = credential.accessToken
    ? { authorization: `Bearer ${credential.accessToken}` }
    : { 'x-api-key': credential.apiKey as string }
  const response = await fetch(`${APP_URL}/api/validate-key`, { headers })
  return response.ok
}

export async function resolveCredential(): Promise<ResolvedCredential | undefined> {
  if (process.env.CREATORCRAWL_API_KEY) {
    return { apiKey: process.env.CREATORCRAWL_API_KEY, source: 'environment' }
  }
  const stored = readCredentials()
  if (!stored) return undefined
  if (stored.type === 'api-key') return { apiKey: stored.apiKey, source: 'stored-api-key' }
  const oauth = stored.expiresAt - Date.now() < 60_000 ? await refreshOAuth(stored) : stored
  return { accessToken: oauth.accessToken, source: 'oauth' }
}

function validateApiKey(apiKey: string): void {
  if (!/^sk_live_[a-f0-9]{64}$/.test(apiKey)) throw new Error('Invalid CreatorCrawl API key format.')
}

export function registerAuth(program: Command): void {
  const auth = program.command('auth').description('Manage CLI authentication')

  auth
    .command('login')
    .description('Authenticate with CreatorCrawl in your browser')
    .option('--api-key <key>', 'Save an API key for non-interactive setup')
    .action(async (options: { apiKey?: string }, command: Command) => {
      const apiKey = command.optsWithGlobals().apiKey as string | undefined
      if (apiKey) {
        validateApiKey(apiKey)
        const credential: ResolvedCredential = { apiKey, source: 'stored-api-key' }
        if (!(await verifyCredential(credential))) throw new Error('Invalid CreatorCrawl API key.')
        await saveCredentials({ type: 'api-key', apiKey })
        console.log('CreatorCrawl API-key authentication saved.')
        return
      }
      const credentials = await browserLogin()
      await saveCredentials(credentials)
      console.log('CreatorCrawl OAuth authentication saved securely.')
      if (process.env.CREATORCRAWL_API_KEY) {
        console.log('Warning: CREATORCRAWL_API_KEY overrides the OAuth login.')
      }
    })

  auth
    .command('status')
    .description('Show authentication status')
    .option('--json', 'Print machine-readable JSON')
    .action(async (options: { json?: boolean }) => {
      let credential: ResolvedCredential | undefined
      let authenticated = false
      try {
        credential = await resolveCredential()
        authenticated = credential ? await verifyCredential(credential) : false
      } catch {
        authenticated = false
      }
      const source = credential?.source ?? null
      if (options.json) console.log(JSON.stringify({ authenticated, source }))
      else console.log(authenticated ? `Authenticated using ${source}.` : 'Not authenticated.')
      if (!authenticated) process.exitCode = 1
    })

  auth
    .command('logout')
    .description('Remove saved CLI authentication')
    .action(async () => {
      const credentials = readCredentials()
      if (credentials?.type === 'oauth') await revokeOAuth(credentials)
      await removeCredentials()
      console.log('CreatorCrawl authentication removed.')
    })
}
