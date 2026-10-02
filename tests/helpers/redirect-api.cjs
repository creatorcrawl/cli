// Exercise the real SDK HTTP client while keeping every request on the fixture server.
const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fetch = global.fetch
const spawnSync = childProcess.spawnSync
childProcess.spawnSync = (command, ...args) =>
  command === 'security' ? { status: 1 } : spawnSync(command, ...args)
global.fetch = (input, options) => {
  const url = new URL(input)
  assert.equal(url.origin, 'https://app.creatorcrawl.com')
  return fetch(new URL(url.pathname + url.search, process.env.CLI_TEST_ORIGIN), options)
}
