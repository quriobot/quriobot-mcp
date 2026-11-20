#!/usr/bin/env node
// The Claude Code plugin's entry point: it runs the newest release with npx, so plugin users get
// updates the way every other client does. npx is a .cmd file on Windows, which only a shell can
// start, hence the shell there. If npx cannot be started at all, the copy of the server shipped in
// this plugin runs instead.

import { spawn } from 'node:child_process'

let fellBack = false
const child = spawn('npx', ['-y', '@quriobot/mcp@latest'], { stdio: 'inherit', shell: process.platform === 'win32' })
child.on('error', () => {
  if (fellBack) return
  fellBack = true
  import('./server.mjs')
})
child.on('exit', (code, signal) => {
  if (!fellBack) process.exit(signal ? 1 : (code ?? 0))
})
