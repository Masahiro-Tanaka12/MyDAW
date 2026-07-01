/**
 * Claude Code 環境では ELECTRON_RUN_AS_NODE=1 が設定されるため、
 * electron-vite dev を起動する前に変数を削除する必要がある。
 * 通常のターミナルから起動する場合はこのスクリプトは不要だが、
 * どちらの環境でも確実に動作するようにラップする。
 */
'use strict'
const { spawn } = require('child_process')
const path = require('path')

delete process.env.ELECTRON_RUN_AS_NODE

const evite = path.join(__dirname, '../node_modules/.bin/electron-vite')
const proc = spawn(evite, ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})
proc.on('close', (code) => process.exit(code ?? 0))
