import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'creatorcrawl-integration-'))
  const requests = []
  const response = {
    status: 200,
    body: {
      data: [{ id: 'first' }],
      page: { cursor: 'next +/&雪', has_more: true },
      meta: { platform: 'test' },
    },
  }
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    requests.push({
      url: new URL(req.url, 'http://localhost'),
      method: req.method,
      headers: req.headers,
      body,
    })
    if (response.disconnect) {
      req.socket.destroy()
      return
    }
    const reply = response.handler ? response.handler(requests.at(-1)) : response
    res.writeHead(reply.status, {
      'content-type': typeof reply.body === 'string' ? 'text/html' : 'application/json',
    })
    res.end(typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  })
  const credentialsPath = join(directory, 'creatorcrawl', 'credentials.json')
  return {
    requests,
    response,
    credentialsPath,
    async credentials(value) {
      await mkdir(join(directory, 'creatorcrawl'), { recursive: true })
      await writeFile(credentialsPath, JSON.stringify(value), { mode: 0o600 })
    },
    run(args, env = {}) {
      return new Promise((resolve) => {
        execFile(
          process.execPath,
          [
            '--require',
            fileURLToPath(new URL('./redirect-api.cjs', import.meta.url)),
            fileURLToPath(new URL('../../dist/index.cjs', import.meta.url)),
            ...args,
          ],
          {
            env: {
              ...process.env,
              NODE_OPTIONS: '',
              XDG_CONFIG_HOME: directory,
              CREATORCRAWL_API_KEY: 'fixture-key',
              CLI_TEST_ORIGIN: `http://127.0.0.1:${server.address().port}`,
              ...env,
            },
            encoding: 'utf8',
            timeout: 10000,
          },
          (error, stdout, stderr) => resolve({ code: error?.code ?? 0, stdout, stderr }),
        )
      })
    },
  }
}
