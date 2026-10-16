import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const apiBase = 'https://api.football-data.org/v4'
const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const token = env.FOOTBALL_DATA_TOKEN || process.env.FOOTBALL_DATA_TOKEN
  let cachedMatches = null
  let cacheUntil = 0

  return {
    plugins: [
      react(),
      {
        name: 'live-fixture-search',
        configureServer(server) {
          server.middlewares.use('/fixtures-api', async (req, res) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            if (!token) {
              res.statusCode = 503
              res.end(JSON.stringify({ error: 'Live fixtures need a football-data.org token. Add FOOTBALL_DATA_TOKEN to .env.local and restart the dev server.' }))
              return
            }

            const url = new URL(req.url, 'http://localhost')
            const query = normalize(url.searchParams.get('search') || '')
            if (!query) {
              res.end(JSON.stringify({ matches: [] }))
              return
            }

            try {
              if (!cachedMatches || Date.now() > cacheUntil) {
                const headers = { 'X-Auth-Token': token }
                const competitionsResponse = await fetch(`${apiBase}/competitions`, { headers })
                if (!competitionsResponse.ok) throw new Error(`Fixture provider returned ${competitionsResponse.status}.`)
                const competitionsData = await competitionsResponse.json()
                const competitions = competitionsData.competitions || []
                const aliases = { laliga: 'primera division', epl: 'premier league', seriea: 'serie a' }
                const searchValue = normalize(aliases[query] || query)
                const target = competitions.find((competition) => {
                  const text = normalize(`${competition.name} ${competition.code} ${competition.area?.name || ''}`)
                  return text.includes(searchValue)
                })
                const selected = target ? [target] : competitions
                const ids = selected.map((competition) => competition.id).join(',')
                if (!ids) {
                  cachedMatches = []
                } else {
                  const from = new Date().toISOString().slice(0, 10)
                  const to = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
                  const response = await fetch(`${apiBase}/matches?competitions=${ids}&dateFrom=${from}&dateTo=${to}`, { headers })
                  if (!response.ok) throw new Error(`Fixture provider returned ${response.status}.`)
                  const data = await response.json()
                  cachedMatches = (data.matches || []).map((match) => ({
                    id: String(match.id),
                    league: match.competition?.name || 'Football',
                    home: match.homeTeam?.name || 'Home team',
                    away: match.awayTeam?.name || 'Away team',
                    status: match.status?.replaceAll('_', ' ') || 'SCHEDULED',
                    utcDate: match.utcDate,
                    score: match.score?.fullTime?.home == null ? '' : `${match.score.fullTime.home} - ${match.score.fullTime.away}`,
                  }))
                }
                cacheUntil = Date.now() + 5 * 60 * 1000
              }

              const matches = cachedMatches.filter((match) => normalize(`${match.league} ${match.home} ${match.away} ${match.status}`).includes(query))
              res.end(JSON.stringify({ matches }))
            } catch (error) {
              res.statusCode = 502
              res.end(JSON.stringify({ error: error.message || 'Unable to load live fixtures.' }))
            }
          })
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${process.env.API_PORT || 3001}`,
          changeOrigin: false,
        },
      },
    },
  }
})
