#!/usr/bin/env node
// The Claude Code plugin's entry point: it runs the newest release with npx, so plugin users get
// updates the way every other client does. npx is a .cmd file on Windows, which only a shell can
// start, hence the shell there. When npx cannot run the release (npx missing, offline, the registry
// down, a broken release: it ends before answering anything), the copy of the server shipped in
// this plugin runs instead. npx reads nothing from stdin before the server starts, so the copy
// still gets every message the client sent.

import { spawn } from 'node:child_process'

const stdio = ['inherit', 'pipe', 'inherit']
// With the network silently down npm can wait minutes, longer than a client waits for a server to
// start: npm gives up sooner (no retries), and a launch that has not answered within 15 s (a
// normal one answers within about a second) is stopped and the shipped copy answers instead.
const env = { ...process.env, npm_config_fetch_retries: '0', npm_config_fetch_timeout: '10000' }
const child = process.platform === 'win32'
  ? spawn('npx -y @quriobot/mcp@latest', { shell: true, stdio, env })
  : spawn('npx', ['-y', '@quriobot/mcp@latest'], { stdio, env })

let answered = false
let fellBack = false
function fallBack() {
  if (answered || fellBack) return
  fellBack = true
  clearTimeout(deadline)
  child.kill()
  import('./server.mjs')
}
const deadline = setTimeout(fallBack, 15_000)

child.stdout.on('data', (chunk) => {
  answered = true
  clearTimeout(deadline)
  process.stdout.write(chunk)
})
child.on('error', fallBack)
child.on('close', (code, signal) => {
  if (fellBack) return
  if (!answered && code !== 0) return fallBack()
  process.exit(signal ? 1 : (code ?? 0))
})
for (const s of ['SIGTERM', 'SIGINT']) {
  process.on(s, () => {
    child.kill(s)
    process.exit(1)
  })
}
