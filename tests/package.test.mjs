import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

test('bundled CLI runs without dependencies and reports the package version', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'creatorcrawl-package-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const binary = join(directory, 'creatorcrawl.cjs')
  copyFileSync(new URL('../dist/index.cjs', import.meta.url), binary)
  const source = readFileSync(binary, 'utf8')
  assert.ok(source.startsWith('#!/usr/bin/env node\n'))
  assert.equal(source.match(/^#!/gm)?.length, 1)
  const run = (args) => execFileSync(process.execPath, [binary, ...args], {
    cwd: directory,
    encoding: 'utf8',
  })
  assert.equal(run(['--version']).trim(), pkg.version)
  assert.match(run(['--help']), /Usage: creatorcrawl/)
  assert.match(run(['auth', '--help']), /login/)
})
