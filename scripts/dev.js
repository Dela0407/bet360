import { spawn } from 'node:child_process'

const processes = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env: process.env }),
]
let stopping = false

function stopAll(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) child.kill()
  }
  process.exitCode = exitCode
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Unable to start a bet360 development process:', error)
    stopAll(1)
  })
  child.on('exit', (code) => {
    if (!stopping) stopAll(code || 0)
  })
}

process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
