import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import type { Command } from 'commander'

interface Credentials {
  apiKey: string
}

function credentialsPath(): string {
  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')
  return join(configHome, 'creatorcrawl', 'credentials.json')
}

export function readStoredApiKey(): string | undefined {
  try {
    const content = readFileSync(credentialsPath(), 'utf8')
    const credentials = JSON.parse(content) as Partial<Credentials>
    return credentials.apiKey
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

async function saveApiKey(apiKey: string): Promise<void> {
  const path = credentialsPath()
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(path, `${JSON.stringify({ apiKey })}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
}

function openApiKeysPage(): void {
  const url = 'https://app.creatorcrawl.com/api-keys'
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

async function promptForApiKey(): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error('Interactive login requires a terminal. Set CREATORCRAWL_API_KEY instead.')
  }
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  process.stdout.write('CreatorCrawl API key: ')
  if (process.platform !== 'win32') spawnSync('stty', ['-echo'], { stdio: ['inherit', 'ignore', 'inherit'] })
  try {
    return (await readline.question('')).trim()
  } finally {
    if (process.platform !== 'win32') spawnSync('stty', ['echo'], { stdio: ['inherit', 'ignore', 'inherit'] })
    readline.close()
    process.stdout.write('\n')
  }
}

function validateApiKey(apiKey: string): void {
  if (!/^sk_live_[a-f0-9]{64}$/.test(apiKey)) {
    throw new Error('Invalid CreatorCrawl API key format.')
  }
}

async function verifyApiKey(apiKey: string): Promise<void> {
  const response = await fetch('https://app.creatorcrawl.com/api/auth/validate-key', {
    headers: { 'x-api-key': apiKey },
  })
  if (!response.ok) {
    throw new Error(response.status === 403 ? 'Invalid CreatorCrawl API key.' : `Authentication check failed (${response.status}).`)
  }
}

export function registerAuth(program: Command): void {
  const auth = program.command('auth').description('Manage CLI authentication')

  auth
    .command('login')
    .description('Save a CreatorCrawl API key')
    .option('--api-key <key>', 'API key for non-interactive setup')
    .option('--no-browser', 'Do not open the API keys page')
    .action(async (options: { apiKey?: string; browser: boolean }, command: Command) => {
      const apiKeyOption = command.optsWithGlobals().apiKey as string | undefined
      if (!apiKeyOption && options.browser) {
        console.log('Create or copy an API key from https://app.creatorcrawl.com/api-keys')
        openApiKeysPage()
      }
      const apiKey = apiKeyOption ?? (await promptForApiKey())
      validateApiKey(apiKey)
      await verifyApiKey(apiKey)
      await saveApiKey(apiKey)
      console.log('CreatorCrawl authentication saved.')
      if (process.env.CREATORCRAWL_API_KEY && process.env.CREATORCRAWL_API_KEY !== apiKey) {
        console.log('Warning: CREATORCRAWL_API_KEY is still set and overrides the saved credential.')
        console.log('Run: unset CREATORCRAWL_API_KEY')
      }
    })

  auth
    .command('status')
    .description('Show authentication status')
    .option('--json', 'Print machine-readable JSON')
    .action(async (options: { json?: boolean }) => {
      const storedApiKey = readStoredApiKey()
      const apiKey = process.env.CREATORCRAWL_API_KEY ?? storedApiKey
      const source = process.env.CREATORCRAWL_API_KEY ? 'environment' : storedApiKey ? 'stored' : null
      let authenticated = false
      if (apiKey) {
        try {
          await verifyApiKey(apiKey)
          authenticated = true
        } catch {
          authenticated = false
        }
      }
      if (options.json) {
        console.log(JSON.stringify({ authenticated, source }))
      } else {
        console.log(
          authenticated
            ? `Authenticated using ${source} credentials.`
            : source
              ? `Invalid ${source} credentials.`
              : 'Not authenticated.',
        )
        if (source === 'environment' && storedApiKey) {
          console.log('CREATORCRAWL_API_KEY overrides the saved credential.')
        }
      }
      if (!authenticated) process.exitCode = 1
    })

  auth
    .command('logout')
    .description('Remove the saved CLI credential')
    .action(async () => {
      await rm(credentialsPath(), { force: true })
      console.log('CreatorCrawl authentication removed.')
    })
}
