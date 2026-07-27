// =========================================================================
// ENTRY POINT — MUST run before any Electron module is loaded.
// When Windows opens neavendestiny:// URLs, they land in process.argv.
// Electron interprets unknown argv entries as file paths → "Cannot find module".
// We strip them here FIRST, then load the real app.
// =========================================================================

const PROTOCOL = 'neavendestiny'

const protocolUrls: string[] = []
const cleanArgv: string[] = []

for (const arg of process.argv) {
  if (arg.startsWith(`${PROTOCOL}://`)) {
    protocolUrls.push(arg)
  } else {
    cleanArgv.push(arg)
  }
}

// Replace argv with the cleaned version so Electron never sees the URL
process.argv = cleanArgv

// Pass the first captured URL to app.ts via a global
;(globalThis as any).__pendingProtocolUrl = protocolUrls[0] || null

// Now safe — argv is clean, load the Electron application
import('./app')
