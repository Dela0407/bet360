import { useEffect, useState } from 'react'
import './App.css'

const sportsTabs = ['Football', 'Basketball', 'Tennis']
const matchOdds = ['2.22', '3.52', '3.08']
const outcomes = ['Home', 'Draw', 'Away']
const markets = ['1x2', 'Over/Under', 'Double Chance', 'GG/NG', 'DNB']
const searchableMatches = [
  {
    id: 'necaxa-america',
    league: 'Liga MX',
    home: 'Necaxa',
    away: 'América',
    status: 'LIVE · HT',
    odds: ['2.22', '3.52', '3.08'],
  },
  {
    id: 'latvia-cyprus',
    league: 'UEFA Nations League',
    home: 'Latvia',
    away: 'Cyprus',
    status: 'UPCOMING · 19:45',
    odds: ['2.72', '3.10', '2.85'],
  },
  {
    id: 'real-madrid-barcelona',
    league: 'LaLiga',
    home: 'Real Madrid',
    away: 'Barcelona',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.10', '3.40', '3.20'],
  },
  {
    id: 'atletico-valencia',
    league: 'LaLiga',
    home: 'Atlético Madrid',
    away: 'Valencia',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.78', '3.55', '4.60'],
  },
  {
    id: 'sevilla-sociedad',
    league: 'LaLiga',
    home: 'Sevilla',
    away: 'Real Sociedad',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.45', '3.10', '2.95'],
  },
  {
    id: 'athletic-villarreal',
    league: 'LaLiga',
    home: 'Athletic Club',
    away: 'Villarreal',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.05', '3.50', '3.35'],
  },
  {
    id: 'betis-girona',
    league: 'LaLiga',
    home: 'Real Betis',
    away: 'Girona',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.30', '3.25', '3.00'],
  },
  {
    id: 'celta-espanyol',
    league: 'LaLiga',
    home: 'Celta Vigo',
    away: 'Espanyol',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.00', '3.20', '3.70'],
  },
  {
    id: 'getafe-osasuna',
    league: 'LaLiga',
    home: 'Getafe',
    away: 'Osasuna',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.40', '2.90', '3.20'],
  },
  {
    id: 'mallorca-alaves',
    league: 'LaLiga',
    home: 'Mallorca',
    away: 'Deportivo Alavés',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.15', '3.00', '3.60'],
  },
  {
    id: 'rayo-palmas',
    league: 'LaLiga',
    home: 'Rayo Vallecano',
    away: 'Las Palmas',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.95', '3.25', '3.80'],
  },
  {
    id: 'leganes-valladolid',
    league: 'LaLiga',
    home: 'Leganés',
    away: 'Real Valladolid',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.25', '3.00', '3.35'],
  },
]

const searchAliases = {
  laliga: ['laliga', 'spanish league', 'primera division'],
  'uefa nations league': ['uefa nations league', 'nations league'],
}

const sportFixtures = [
  ...searchableMatches.map((match) => ({ ...match, sport: 'Football' })),
  {
    id: 'warriors-celtics',
    sport: 'Basketball',
    league: 'Pro Basketball',
    home: 'Golden State Warriors',
    away: 'Boston Celtics',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.91', '1.91'],
  },
  {
    id: 'lakers-bulls',
    sport: 'Basketball',
    league: 'Pro Basketball',
    home: 'Los Angeles Lakers',
    away: 'Chicago Bulls',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.72', '2.10'],
  },
  {
    id: 'bucks-knicks',
    sport: 'Basketball',
    league: 'Pro Basketball',
    home: 'Milwaukee Bucks',
    away: 'New York Knicks',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.84', '1.98'],
  },
  {
    id: 'sinner-alcaraz',
    sport: 'Tennis',
    league: 'Grand Slam Tennis',
    home: 'Jannik Sinner',
    away: 'Carlos Alcaraz',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['1.95', '1.85'],
  },
  {
    id: 'gauff-swiatek',
    sport: 'Tennis',
    league: 'WTA Tour',
    home: 'Coco Gauff',
    away: 'Iga Świątek',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.05', '1.78'],
  },
  {
    id: 'fritz-djokovic',
    sport: 'Tennis',
    league: 'ATP Tour',
    home: 'Taylor Fritz',
    away: 'Novak Djokovic',
    status: 'UPCOMING · DEMO FIXTURE',
    odds: ['2.30', '1.62'],
  },
]

const liveDemoMatches = [
  {
    id: 'live-necaxa-america',
    sport: 'Football',
    league: 'Liga MX',
    home: 'Necaxa',
    away: 'América',
    status: 'HT · DEMO LIVE',
    score: '0 - 0',
    odds: ['2.22', '3.52', '3.08'],
  },
  {
    id: 'live-latvia-cyprus',
    sport: 'Football',
    league: 'UEFA Nations League',
    home: 'Latvia',
    away: 'Cyprus',
    status: '62′ · DEMO LIVE',
    score: '1 - 0',
    odds: ['2.72', '3.10', '2.85'],
  },
  {
    id: 'live-warriors-celtics',
    sport: 'Basketball',
    league: 'Pro Basketball',
    home: 'Golden State Warriors',
    away: 'Boston Celtics',
    status: 'Q4 · 03:12 · DEMO LIVE',
    score: '98 - 94',
    odds: ['1.62', '2.25'],
  },
  {
    id: 'live-lakers-bulls',
    sport: 'Basketball',
    league: 'Pro Basketball',
    home: 'Los Angeles Lakers',
    away: 'Chicago Bulls',
    status: 'Q3 · 05:40 · DEMO LIVE',
    score: '76 - 81',
    odds: ['2.10', '1.72'],
  },
  {
    id: 'live-sinner-alcaraz',
    sport: 'Tennis',
    league: 'Grand Slam Tennis',
    home: 'Jannik Sinner',
    away: 'Carlos Alcaraz',
    status: 'SET 2 · 4-3 · DEMO LIVE',
    score: '1 - 1 sets',
    odds: ['1.88', '1.92'],
  },
]

const virtualGames = [
  { id: 'virtual-football', sport: 'Football', home: 'Emerald FC', away: 'City United', icon: '⚽', odds: 1.9 },
  { id: 'virtual-basketball', sport: 'Basketball', home: 'Green Hoops', away: 'Metro Stars', icon: '🏀', odds: 1.9 },
  { id: 'virtual-tennis', sport: 'Tennis', home: 'A. Green', away: 'M. Court', icon: '🎾', odds: 1.9 },
]

function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function describeOutcome(selection) {
  if (selection.outcome === '1') return `${selection.home} to win`
  if (selection.outcome === '2') return `${selection.away} to win`
  return 'Draw'
}

async function requestApi(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }
  if (!response.ok) throw new Error(data.error || 'The server could not complete that request.')
  return data
}

function OddButton({ label, value, compact = false, selectedOdds, onToggle, match }) {
  const outcomeKey = { Home: '1', Draw: 'X', Away: '2' }[label] ?? label
  const selection = {
    id: `${match.id}-${outcomeKey}`,
    matchId: match.id,
    league: match.league,
    home: match.home,
    away: match.away,
    outcome: outcomeKey,
    odds: Number(value),
  }
  const isSelected = selectedOdds.some((selected) => selected.id === selection.id)

  return (
    <button
      className={`odd-button${compact ? ' compact' : ''}${isSelected ? ' selected' : ''}`}
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(selection)}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  )
}

function FixtureCard({ match, selectedOdds, onToggle, live = false }) {
  const outcomesForMatch = match.odds.length === 2 ? ['1', '2'] : ['1', 'X', '2']

  return (
    <article className={`fixture-card${live ? ' live-fixture-card' : ''}`}>
      <div className="fixture-info">
        <div className="fixture-heading">
          <span className="search-league">{match.league}</span>
          <span className={live ? 'fixture-live-status' : 'search-status'}>{match.status}</span>
        </div>
        <div className="fixture-team-line">
          <strong>{match.home}</strong>
          {live && <b>{match.score.split(' - ')[0]}</b>}
        </div>
        <div className="fixture-team-line">
          <strong>{match.away}</strong>
          {live && <b>{match.score.split(' - ')[1]}</b>}
        </div>
      </div>
      <div className="fixture-odds" aria-label={`Odds for ${match.home} versus ${match.away}`}>
        {outcomesForMatch.map((outcome, index) => (
          <OddButton
            compact
            key={outcome}
            label={outcome}
            value={match.odds[index]}
            selectedOdds={selectedOdds}
            onToggle={onToggle}
            match={match}
          />
        ))}
      </div>
    </article>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Home')
  const [activeSport, setActiveSport] = useState('Football')
  const [activeMarket, setActiveMarket] = useState('1x2')
  const [activeBottom, setActiveBottom] = useState('bet360')
  const [selectedOdds, setSelectedOdds] = useState([])
  const [slipOpen, setSlipOpen] = useState(false)
  const [betStake, setBetStake] = useState('10')
  const [slipMessage, setSlipMessage] = useState('')
  const [placedBets, setPlacedBets] = useState([])
  const [virtualResults, setVirtualResults] = useState({})
  const [virtualWagers, setVirtualWagers] = useState({})
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [authMode, setAuthMode] = useState(null)
  const [authMessage, setAuthMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [demoBalance, setDemoBalance] = useState(0)
  const [backendError, setBackendError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMessage, setDepositMessage] = useState('')
  useEffect(() => {
    let cancelled = false
    async function loadAccount() {
      try {
        const { user } = await requestApi('/api/me')
        if (!cancelled && user) {
          setProfile(user)
          setDemoBalance(user.balance)
          const { bets } = await requestApi('/api/bets')
          if (!cancelled) setPlacedBets(bets)
        }
      } catch (error) {
        if (!cancelled) setBackendError(error.message)
      }
    }
    loadAccount()
    return () => {
      cancelled = true
    }
  }, [])
  const normalizedSearch = normalizeSearch(searchTerm.trim())
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean)
  const searchResults = searchTerms.length
    ? sportFixtures.filter((match) => {
      const leagueAliases = searchAliases[normalizeSearch(match.league)] ?? []
      const searchableText = normalizeSearch([
        match.league,
        ...leagueAliases,
        match.sport,
        match.home,
        match.away,
        match.status,
      ].join(' '))
      return searchTerms.every((term) => searchableText.includes(term))
    })
    : []

  function toggleOdd(odd) {
    setSelectedOdds((selected) =>
      selected.some((selection) => selection.id === odd.id)
        ? selected.filter((selection) => selection.id !== odd.id)
        : [...selected, odd],
    )
    setSlipMessage('')
  }

  async function playVirtualGame(game) {
    const wager = virtualWagers[game.id] ?? { team: 'home', stake: '10', message: '' }
    const stake = Number(wager.stake)
    if (!profile) {
      setVirtualWagers((wagers) => ({
        ...wagers,
        [game.id]: { ...wager, message: 'Log in or create an account before placing a virtual wager.' },
      }))
      return
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      setVirtualWagers((wagers) => ({
        ...wagers,
        [game.id]: { ...wager, message: 'Enter a valid wager greater than zero.' },
      }))
      return
    }
    if (stake > demoBalance) {
      setVirtualWagers((wagers) => ({
        ...wagers,
        [game.id]: { ...wager, message: `Your wallet has ${demoBalance.toFixed(2)} demo credits. Add demo credits to place this wager.` },
      }))
      return
    }

    try {
      const response = await requestApi('/api/wallet/virtual-wager', {
        method: 'POST',
        body: JSON.stringify({ gameId: game.id, team: wager.team, stake }),
      })
      setProfile(response.user)
      setDemoBalance(response.user.balance)
      setVirtualResults((results) => ({
        ...results,
        [game.id]: { ...response.result, wageredTeam: wager.team },
      }))
      setVirtualWagers((wagers) => ({
        ...wagers,
        [game.id]: { ...wager, message: '' },
      }))
    } catch (error) {
      setVirtualWagers((wagers) => ({
        ...wagers,
        [game.id]: { ...wager, message: error.message },
      }))
    }
  }

  async function placeDemoBets(event) {
    event.preventDefault()
    const stake = Number(betStake)

    if (!profile) {
      setSlipMessage('Log in or create an account before placing demo bets.')
      return
    }
    if (!Number.isFinite(stake) || stake <= 0) {
      setSlipMessage('Enter a valid stake greater than zero.')
      return
    }

    try {
      const response = await requestApi('/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          stake,
          selections: selectedOdds.map((selection) => ({
            matchId: selection.matchId,
            league: selection.league,
            home: selection.home,
            away: selection.away,
            outcome: selection.outcome,
            odds: selection.odds,
          })),
        }),
      })
      setProfile(response.user)
      setDemoBalance(response.user.balance)
      setPlacedBets((bets) => [...response.bets, ...bets])
      setSelectedOdds([])
      setBetStake('10')
      setSlipMessage('')
      setSlipOpen(false)
      setActiveBottom('My Bets')
    } catch (error) {
      setSlipMessage(error.message)
    }
  }

  return (
    <main className={`app-shell${authMode ? ' auth-mode' : ''}`}>
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          aria-label="bet360 home"
          onClick={() => {
            setAuthMode(null)
            setAuthMessage('')
            setActiveNav('Home')
            setActiveBottom('bet360')
            setSlipOpen(false)
          }}
        >
          <span className="brand-mark">b</span>
          <span>bet<span className="brand-number">360</span></span>
        </a>
        <div className="top-actions">
          {!authMode && (
            <button
              className={`icon-button${searchOpen ? ' active' : ''}`}
              type="button"
              aria-label="Search"
              onClick={() => {
                setActiveBottom('bet360')
                setActiveNav('Home')
                setSlipOpen(false)
                if (searchOpen) setSearchTerm('')
                setSearchOpen(!searchOpen)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.6" />
                <path d="m16 16 4.2 4.2" />
              </svg>
            </button>
          )}
          <button
            className="login-button"
            type="button"
            onClick={() => {
              setAuthMode('login')
              setAuthMessage('')
              setSearchOpen(false)
              setSearchTerm('')
            }}
          >
            Login
          </button>
          <button
            className="join-button"
            type="button"
            onClick={() => {
              setAuthMode('signup')
              setAuthMessage('')
              setSearchOpen(false)
              setSearchTerm('')
            }}
          >
            Join
          </button>
        </div>
      </header>

      {backendError && !authMode && (
        <p className="auth-message" role="alert">
          Account service unavailable: {backendError}
        </p>
      )}

      {!authMode && (
        <section className="wallet-strip" aria-label="Wallet balance">
          <button
            className="wallet-strip-balance"
            type="button"
            onClick={() => {
              setActiveBottom('Me')
              setSlipOpen(false)
              setDepositOpen(false)
            }}
          >
            <span className="wallet-strip-icon" aria-hidden="true">▤</span>
            <span className="wallet-strip-label">WALLET BALANCE</span>
            <strong>{demoBalance.toFixed(2)} <span>demo credits</span></strong>
          </button>
          <button
            className="wallet-strip-deposit"
            type="button"
            onClick={() => {
              setActiveBottom('Me')
              setSlipOpen(false)
              setDepositOpen(true)
              setDepositAmount('')
              setDepositMessage('')
              setSearchOpen(false)
              setSearchTerm('')
            }}
          >
            Deposit
          </button>
        </section>
      )}

      {!authMode && searchOpen && (
        <form className="search-bar" onSubmit={(event) => event.preventDefault()} role="search">
          <input
            autoFocus
            aria-label="Search teams or leagues"
            placeholder="Search leagues or teams (e.g. LaLiga)"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" type="button" onClick={() => setSearchTerm('')}>
              Clear
            </button>
          )}
        </form>
      )}

      {!authMode && <nav className="main-nav" aria-label="Main navigation">
        {['Home', 'Live', 'Sports', 'Scores', 'Virtual Games'].map((item) => (
          <button
            className={activeNav === item ? 'active' : ''}
            key={item}
            type="button"
            onClick={() => {
              setActiveNav(item)
              setActiveBottom('bet360')
              setSlipOpen(false)
              setDepositOpen(false)
            }}
          >
            {item}
          </button>
        ))}
      </nav>}

      <div className="page-content" id="home">
        {authMode ? (
          <section className="auth-page">
            <div className="auth-card">
              <button
                className="auth-back"
                type="button"
                onClick={() => {
                  setAuthMode(null)
                  setAuthMessage('')
                }}
              >
                <span aria-hidden="true">←</span> Back to bet360
              </button>
              <span className="eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'JOIN BET360'}</span>
              <h1>{authMode === 'login' ? 'Log in to your account' : 'Create your account'}</h1>
              <p className="auth-intro">
                {authMode === 'login'
                  ? 'Enter your details to continue to bet360.'
                  : 'Sign up to follow matches and keep your bets in one place.'}
              </p>
              <form
                className="auth-form"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  if (authMode === 'signup' && formData.get('password') !== formData.get('confirmPassword')) {
                    setAuthMessage('Your passwords do not match. Please check and try again.')
                    return
                  }
                  setAuthBusy(true)
                  try {
                    const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup'
                    const body = {
                      email: String(formData.get('email')),
                      password: String(formData.get('password')),
                    }
                    if (authMode === 'signup') body.name = String(formData.get('name'))
                    const { user } = await requestApi(path, {
                      method: 'POST',
                      body: JSON.stringify(body),
                    })
                    setProfile(user)
                    setDemoBalance(user.balance)
                    setBackendError('')
                    setAuthMode(null)
                    setAuthMessage('')
                    try {
                      const { bets } = await requestApi('/api/bets')
                      setPlacedBets(bets)
                    } catch (error) {
                      setBackendError(error.message)
                    }
                  } catch (error) {
                    setAuthMessage(error.message)
                  } finally {
                    setAuthBusy(false)
                  }
                }}
              >
                {authMode === 'signup' && (
                  <label>
                    Full name
                    <input autoComplete="name" name="name" placeholder="Your name" required />
                  </label>
                )}
                <label>
                  Email address
                  <input
                    autoComplete="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    minLength={8}
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                  />
                </label>
                {authMode === 'signup' && (
                  <label>
                    Confirm password
                    <input
                      autoComplete="new-password"
                      minLength={8}
                      name="confirmPassword"
                      type="password"
                      placeholder="Enter your password again"
                      required
                    />
                  </label>
                )}
                {authMode === 'signup' && (
                  <label className="terms-check">
                    <input name="terms" type="checkbox" required />
                    <span>I agree to the terms and confirm I meet the legal age requirement.</span>
                  </label>
                )}
                <button className="auth-submit" disabled={authBusy} type="submit">
                  {authMode === 'login' ? 'Log in' : 'Create account'}
                </button>
                {authMessage && <p className="auth-message" aria-live="polite">{authMessage}</p>}
              </form>
              <p className="auth-switch">
                {authMode === 'login' ? 'New to bet360?' : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login')
                    setAuthMessage('')
                  }}
                >
                  {authMode === 'login' ? ' Create an account' : ' Log in'}
                </button>
              </p>
            </div>
          </section>
        ) : slipOpen ? (
          <section className="account-page">
            <div className="account-content">
              <section className="account-card bet-slip-page">
                <button className="auth-back" type="button" onClick={() => setSlipOpen(false)}>
                  <span aria-hidden="true">←</span> Back to matches
                </button>
                <span className="eyebrow">BET SLIP · DEMO</span>
                <h1>Review your selections</h1>
                <p className="demo-notice">Demo bets only. No real money is wagered. Stake is per selection.</p>
                {selectedOdds.length ? (
                  <>
                    <div className="slip-selections">
                      {selectedOdds.map((selection) => (
                        <article className="slip-selection" key={selection.id}>
                          <div>
                            <span className="search-league">{selection.league}</span>
                            <strong>{selection.home} vs {selection.away}</strong>
                            <span className="slip-pick">{describeOutcome(selection)} · odds {selection.odds.toFixed(2)}</span>
                          </div>
                          <button
                            className="remove-selection"
                            type="button"
                            aria-label={`Remove ${selection.home} versus ${selection.away}`}
                            onClick={() => toggleOdd(selection)}
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>
                    <form className="auth-form bet-slip-form" onSubmit={placeDemoBets}>
                      <label>
                        Stake per selection (demo credits)
                        <input
                          min="0.01"
                          max="10000"
                          name="stake"
                          required
                          step="0.01"
                          type="number"
                          value={betStake}
                          onChange={(event) => {
                            setBetStake(event.target.value)
                            setSlipMessage('')
                          }}
                        />
                      </label>
                      <div className="slip-total">
                        <span>Total stake</span>
                        <strong>{(Number(betStake || 0) * selectedOdds.length).toFixed(2)} credits</strong>
                      </div>
                      <div className="slip-total">
                        <span>Available demo balance</span>
                        <strong>{demoBalance.toFixed(2)} credits</strong>
                      </div>
                      <button className="auth-submit" type="submit">Place demo bet</button>
                      {slipMessage && (
                        <p className="auth-message" aria-live="polite">
                          {slipMessage}
                          {demoBalance < Number(betStake || 0) * selectedOdds.length && (
                            <button
                              className="deposit-from-slip"
                              type="button"
                              onClick={() => {
                                setActiveBottom('Me')
                                setSlipOpen(false)
                                setDepositOpen(true)
                                setDepositAmount('')
                                setDepositMessage('')
                              }}
                            >
                              Go to demo deposit
                            </button>
                          )}
                        </p>
                      )}
                    </form>
                  </>
                ) : (
                  <div className="no-search-results">
                    <strong>Your bet slip is empty</strong>
                    <span>Choose odds from a match to add a selection.</span>
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : activeBottom === 'My Bets' ? (
          <section className="account-page">
            <div className="account-content">
              <div className="account-heading">
                <span className="eyebrow">YOUR ACTIVITY</span>
                <h1>My Bets</h1>
              </div>
              <p className="demo-notice">Demo bets only. These selections do not represent real-money wagers.</p>
              {placedBets.length ? (
                <div className="placed-bets-list">
                  {placedBets.map((bet) => (
                    <article className="account-card placed-bet-card" key={bet.betId}>
                      <div className="placed-bet-heading">
                        <span className="search-league">{bet.league}</span>
                        <span className="bet-status">PENDING · DEMO</span>
                      </div>
                      <div className="placed-bet-match">
                        <strong>{bet.home}</strong>
                        <span>vs</span>
                        <strong>{bet.away}</strong>
                      </div>
                      <div className="placed-bet-pick">
                        <span>{describeOutcome(bet)} · odds {bet.odds.toFixed(2)}</span>
                        <time dateTime={bet.placedAt}>{new Date(bet.placedAt).toLocaleString()}</time>
                      </div>
                      <div className="placed-bet-totals">
                        <div><span>Stake</span><strong>{bet.stake.toFixed(2)} credits</strong></div>
                        <div><span>Potential return</span><strong>{bet.potentialReturn.toFixed(2)} credits</strong></div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-card empty-bets">
                  <span className="wallet-icon" aria-hidden="true">▤</span>
                  <strong>No bets placed yet</strong>
                  <span>
                    {profile
                      ? 'Choose odds on a match, review your bet slip, then place a demo bet to see it here.'
                      : 'Log in to see your saved bets or create an account before placing a demo bet.'}
                  </span>
                  <button
                    className="profile-signup"
                    type="button"
                    onClick={() => {
                      if (profile) setActiveBottom('bet360')
                      else {
                        setAuthMode('login')
                        setAuthMessage('')
                      }
                    }}
                  >
                    {profile ? 'Browse matches' : 'Log in'}
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : activeBottom === 'Me' ? (
          <section className="account-page">
            {depositOpen ? (
              <div className="account-card deposit-card">
                <button
                  className="auth-back"
                  type="button"
                  onClick={() => {
                    setDepositOpen(false)
                    setDepositMessage('')
                  }}
                >
                  <span aria-hidden="true">←</span> Back to my account
                </button>
                <span className="eyebrow">BET360 WALLET</span>
                <h1>Make a deposit</h1>
                <p className="auth-intro">Add demo credits to your wallet.</p>
                <p className="demo-notice">
                  Demo only. This adds credits to your local account balance. No payment is taken and no real money is involved.
                </p>
                <form
                  className="auth-form"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    const amount = Number(depositAmount)
                    if (!profile) {
                      setDepositMessage('Log in or create an account before adding demo credits.')
                      return
                    }
                    try {
                      const response = await requestApi('/api/wallet/demo-deposit', {
                        method: 'POST',
                        body: JSON.stringify({ amount }),
                      })
                      setProfile(response.user)
                      setDemoBalance(response.user.balance)
                      setBackendError('')
                      setDepositMessage(`${amount.toFixed(2)} demo credits added. No real payment was processed.`)
                    } catch (error) {
                      setDepositMessage(error.message)
                    }
                  }}
                >
                  <fieldset className="amount-picker">
                    <legend>Choose an amount (demo credits)</legend>
                    {[10, 25, 50, 100].map((amount) => (
                      <button
                        className={depositAmount === String(amount) ? 'active' : ''}
                        key={amount}
                        type="button"
                        aria-pressed={depositAmount === String(amount)}
                        onClick={() => {
                          setDepositAmount(String(amount))
                          setDepositMessage('')
                        }}
                      >
                        {amount}
                      </button>
                    ))}
                  </fieldset>
                  <label>
                    Amount (demo credits)
                    <input
                      max="10000"
                      min="1"
                      name="amount"
                      placeholder="Enter an amount"
                      required
                      step="0.01"
                      type="number"
                      value={depositAmount}
                      onChange={(event) => {
                        setDepositAmount(event.target.value)
                        setDepositMessage('')
                      }}
                    />
                  </label>
                  <button className="auth-submit" type="submit">Continue to deposit</button>
                  {depositMessage && <p className="auth-message" aria-live="polite">{depositMessage}</p>}
                </form>
              </div>
            ) : (
              <div className="account-content">
                <div className="account-heading">
                  <span className="eyebrow">YOUR ACCOUNT</span>
                  <h1>Me</h1>
                </div>
                <section className="account-card profile-card">
                  <div className="profile-avatar" aria-hidden="true">
                    {(profile?.name?.[0] ?? 'G').toUpperCase()}
                  </div>
                  <div className="profile-heading">
                    <h2>{profile?.name ?? 'Guest user'}</h2>
                    <span className="account-status">{profile ? 'Registered account · demo credits only' : 'Guest account'}</span>
                  </div>
                  <dl className="profile-details">
                    <div>
                      <dt>Full name</dt>
                      <dd>{profile?.name ?? 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt>Email address</dt>
                      <dd>{profile?.email ?? 'Sign up to add your email'}</dd>
                    </div>
                    <div>
                      <dt>Account</dt>
                      <dd>{profile ? 'Registered account' : 'Not signed in'}</dd>
                    </div>
                  </dl>
                  {profile && (
                    <p className="profile-note">
                      Account details and demo-credit balance are stored in the local SQLite database.
                    </p>
                  )}
                  {!profile && (
                    <button
                      className="profile-signup"
                      type="button"
                      onClick={() => {
                        setAuthMode('signup')
                        setAuthMessage('')
                      }}
                    >
                      Create an account
                    </button>
                  )}
                  {profile && (
                    <button
                      className="profile-signup"
                      type="button"
                      onClick={async () => {
                        try {
                          await requestApi('/api/auth/logout', { method: 'POST', body: '{}' })
                          setProfile(null)
                          setDemoBalance(0)
                          setPlacedBets([])
                          setVirtualResults({})
                          setBackendError('')
                          setActiveBottom('bet360')
                        } catch (error) {
                          setBackendError(error.message)
                        }
                      }}
                    >
                      Log out
                    </button>
                  )}
                </section>
                <section className="account-card wallet-card">
                  <div className="wallet-summary">
                    <div>
                      <span className="eyebrow">BET360 WALLET</span>
                      <h2>{demoBalance.toFixed(2)} <span>demo credits</span></h2>
                    </div>
                    <span className="wallet-icon" aria-hidden="true">▤</span>
                  </div>
                  <p>Demo balance only. No real funds are held in this wallet.</p>
                  <button
                    className="auth-submit"
                    type="button"
                    onClick={() => {
                      setDepositOpen(true)
                      setDepositAmount('')
                      setDepositMessage('')
                    }}
                  >
                    Deposit
                  </button>
                </section>
              </div>
            )}
          </section>
        ) : activeNav === 'Live' ? (
          <section className="sports-page">
            <div className="sports-page-heading">
              <div>
                <span className="eyebrow">IN-PLAY NOW</span>
                <h1>Live matches</h1>
              </div>
              <span className="live-indicator"><i /> DEMO FEED</span>
            </div>
            <p className="demo-notice">
              These are sample scores for preview only, not a real-time sports feed. Connect a live data provider for current matches.
            </p>
            <div className="sport-selector" aria-label="Filter live matches by sport">
              {sportsTabs.map((sport) => (
                <button
                  className={activeSport === sport ? 'active' : ''}
                  key={sport}
                  type="button"
                  aria-pressed={activeSport === sport}
                  onClick={() => setActiveSport(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>
            <div className="fixture-list">
              {liveDemoMatches
                .filter((match) => match.sport === activeSport)
                .map((match) => (
                  <FixtureCard key={match.id} match={match} selectedOdds={selectedOdds} onToggle={toggleOdd} live />
                ))}
            </div>
          </section>
        ) : activeNav === 'Sports' ? (
          <section className="sports-page">
            <div className="sports-page-heading">
              <div>
                <span className="eyebrow">BROWSE SPORTS</span>
                <h1>{activeSport}</h1>
              </div>
              <span className="sample-label">SAMPLE FIXTURES</span>
            </div>
            <p className="demo-notice">
              Match schedules and odds below are demo data and may not reflect real events or current prices.
            </p>
            <div className="sport-selector" aria-label="Choose a sport">
              {sportsTabs.map((sport) => (
                <button
                  className={activeSport === sport ? 'active' : ''}
                  key={sport}
                  type="button"
                  aria-pressed={activeSport === sport}
                  onClick={() => setActiveSport(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>
            <div className="fixture-list">
              {sportFixtures
                .filter((match) => match.sport === activeSport && match.status.startsWith('UPCOMING'))
                .map((match) => (
                  <FixtureCard key={match.id} match={match} selectedOdds={selectedOdds} onToggle={toggleOdd} />
                ))}
            </div>
          </section>
        ) : activeNav === 'Virtual Games' ? (
          <section className="sports-page virtual-page">
            <div className="sports-page-heading">
              <div>
                <span className="eyebrow">PLAY FOR FUN</span>
                <h1>Virtual Games</h1>
              </div>
              <span className="sample-label">DEMO MODE</span>
            </div>
            <p className="demo-notice">
              Place demo-credit wagers on a team, then play an instant simulation. Winning returns a demo prize to your wallet; no real money is involved.
            </p>
            <div className="virtual-game-list">
              {virtualGames.map((game) => (
                <article className="account-card virtual-game-card" key={game.id}>
                  <div className="virtual-game-icon" aria-hidden="true">{game.icon}</div>
                  <span className="search-league">VIRTUAL {game.sport.toUpperCase()}</span>
                  <h2>{game.home} <span>vs</span> {game.away}</h2>
                  <div className={`virtual-score${virtualResults[game.id] ? ' has-result' : ''}`} aria-live="polite">
                    {virtualResults[game.id]?.score ?? 'Ready to play'}
                  </div>
                  <div className="virtual-team-picker" role="group" aria-label={`Choose a winner for ${game.home} versus ${game.away}`}>
                    {[
                      ['home', game.home],
                      ['away', game.away],
                    ].map(([team, name]) => (
                      <button
                        className={(virtualWagers[game.id]?.team ?? 'home') === team ? 'active' : ''}
                        key={team}
                        type="button"
                        aria-pressed={(virtualWagers[game.id]?.team ?? 'home') === team}
                        onClick={() => setVirtualWagers((wagers) => ({
                          ...wagers,
                          [game.id]: {
                            ...wagers[game.id],
                            team,
                            stake: wagers[game.id]?.stake ?? '10',
                            message: '',
                          },
                        }))}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <label className="virtual-stake">
                    Wager (demo credits)
                    <input
                      aria-label={`Wager amount for ${game.home} versus ${game.away}`}
                      min="0.01"
                      max={demoBalance}
                      step="0.01"
                      type="number"
                      value={virtualWagers[game.id]?.stake ?? '10'}
                      onChange={(event) => setVirtualWagers((wagers) => ({
                        ...wagers,
                        [game.id]: {
                          ...wagers[game.id],
                          team: wagers[game.id]?.team ?? 'home',
                          stake: event.target.value,
                          message: '',
                        },
                      }))}
                    />
                  </label>
                  <p className="virtual-potential">
                    Winning prize return: {(Number(virtualWagers[game.id]?.stake ?? 10) * game.odds).toFixed(2)} credits at {game.odds.toFixed(2)} odds
                  </p>
                  {virtualWagers[game.id]?.message && (
                    <p className="auth-message virtual-wager-message" aria-live="polite">
                      {virtualWagers[game.id].message}
                    </p>
                  )}
                  {virtualResults[game.id] && (
                    <p className={`virtual-result-message${virtualResults[game.id].won ? ' won' : ' lost'}`} aria-live="polite">
                      {virtualResults[game.id].won
                        ? `You won! ${virtualResults[game.id].prize.toFixed(2)} demo credits returned to your wallet.`
                        : `${virtualResults[game.id].winner === 'home' ? game.home : game.away} won. Your ${virtualResults[game.id].stake.toFixed(2)} demo-credit wager was used.`}
                    </p>
                  )}
                  <button className="auth-submit" type="button" onClick={() => playVirtualGame(game)}>
                    {virtualResults[game.id] ? 'Place wager & play again' : 'Place demo wager & play'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : normalizedSearch ? (
          <section className="search-results" aria-live="polite">
            <div className="search-results-heading">
              <div>
                <span className="eyebrow">SEARCH RESULTS</span>
                <h1>{searchTerm.trim()}</h1>
              </div>
              <strong>{searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}</strong>
            </div>
            <p className="demo-notice">
              Demo fixtures and sample odds. Connect a sports data provider for live schedules and odds.
            </p>
            {searchResults.length ? (
              <div className="search-results-list">
                {searchResults.map((match) => (
                  <article className="search-result-card" key={match.id}>
                    <div className="search-result-info">
                      <span className="search-league">{match.league}</span>
                      <span className="search-status">{match.status}</span>
                      <strong>{match.home}</strong>
                      <strong>{match.away}</strong>
                    </div>
                    <div className="search-result-odds" aria-label={`Odds for ${match.home} versus ${match.away}`}>
                      {(match.odds.length === 2 ? ['1', '2'] : ['1', 'X', '2']).map((outcome, index) => (
                        <OddButton
                          compact
                          key={outcome}
                          label={outcome}
                          value={match.odds[index]}
                          selectedOdds={selectedOdds}
                          onToggle={toggleOdd}
                          match={match}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="no-search-results">
                <strong>No matches found</strong>
                <span>Try a league, team, or a shorter search term.</span>
              </div>
            )}
          </section>
        ) : (
          <>
        <section className="featured-games" aria-label="Featured live games">
          <article className="featured-card">
            <div className="featured-heading">
              <span>Liga MX</span>
              <span className="live-indicator"><i /> DEMO LIVE</span>
            </div>
            <div className="featured-match">
              <div className="teams">
                <span><b className="team-badge necaxa">N</b>Necaxa</span>
                <span><b className="team-badge america">A</b>América</span>
              </div>
              <div className="score"><strong>0-0</strong><small>HT</small></div>
            </div>
            <div className="featured-odds">
              {outcomes.map((outcome, index) => (
                <OddButton compact key={outcome} label={outcome} value={matchOdds[index]} selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[0]} />
              ))}
            </div>
          </article>
          <article className="featured-card second-feature">
            <div className="featured-heading">
              <span>UEFA Nations League</span>
              <span className="live-indicator"><i /> DEMO LIVE</span>
            </div>
            <div className="featured-match">
              <div className="teams">
                <span><b className="flag">🇱🇻</b>Latvia</span>
                <span><b className="flag">🇨🇾</b>Cyprus</span>
              </div>
              <div className="score"><strong>1-0</strong><small>62&apos;</small></div>
            </div>
            <div className="featured-odds">
              <OddButton compact label="1" value="2.72" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
              <OddButton compact label="X" value="3.10" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
              <OddButton compact label="2" value="2.85" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
            </div>
          </article>
        </section>

        <section className="sports-panel live-panel" aria-label="Live matches">
          <div className="sports-tabs">
            <div className="section-brand">Liv<span>e</span></div>
            <div className="tab-strip">
              {sportsTabs.map((sport) => (
                <button
                  className={activeSport === sport ? 'active' : ''}
                  key={sport}
                  type="button"
                  onClick={() => {
                    setActiveSport(sport)
                    setActiveNav('Sports')
                  }}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>
          <p className="home-live-notice">Demo live scores · sample data only</p>
          <div className="panel-heading">
            <strong>In-Play Matches</strong>
            <div className="column-labels"><span>1</span><span>X</span><span>2</span></div>
          </div>
          <button className="league-row" type="button">
            <span><span className="mini-ball">⚽</span> Liga MX</span>
            <span className="chevron">›</span>
          </button>
          <div className="date-row">
            <strong>Monday 28/09</strong>
            <div className="column-labels"><span>1</span><span>X</span><span>2</span></div>
          </div>
          <article className="match-card live-match">
            <div className="match-details">
              <div className="match-meta"><span>HT</span><span>Liga MX</span><span className="chart-icon">▥</span></div>
              <div className="match-team"><b className="team-badge necaxa">N</b><span>Necaxa</span><em>0</em></div>
              <div className="match-team"><b className="team-badge america">A</b><span>América</span><em>0</em></div>
              <div className="best-odds">♧ BEST ODDS</div>
            </div>
            <div className="match-markets">
              {outcomes.map((outcome, index) => (
                <OddButton key={outcome} label={outcome} value={matchOdds[index]} selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[0]} />
              ))}
            </div>
          </article>
        </section>

        <section className="sports-panel upcoming-panel" aria-label="Upcoming matches">
          <div className="sports-tabs">
            <div className="section-brand">Sport<span className="sport-dot">s</span></div>
            <div className="tab-strip">
              {sportsTabs.map((sport) => (
                <button
                  className={activeSport === sport ? 'active' : ''}
                  key={sport}
                  type="button"
                  onClick={() => {
                    setActiveSport(sport)
                    setActiveNav('Sports')
                  }}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>
          <div className="market-tabs">
            {markets.map((market) => (
              <button
                className={activeMarket === market ? 'active' : ''}
                key={market}
                type="button"
                onClick={() => setActiveMarket(market)}
              >
                {market}{market === '1x2' && <span className="down-arrow">⌄</span>}
              </button>
            ))}
          </div>
          <div className="panel-heading">
            <strong>UPCOMING MATCHES</strong>
            <div className="column-labels"><span>1</span><span>X</span><span>2</span></div>
          </div>
          <button className="league-row upcoming-league" type="button">
            <span><span className="league-icon">▥</span> UEFA Nations League</span>
            <span className="chevron">›</span>
          </button>
          <div className="date-row">
            <strong>Monday 28/09</strong>
            <div className="column-labels"><span>1</span><span>X</span><span>2</span></div>
          </div>
          <article className="match-card upcoming-match">
            <div className="match-details">
              <div className="match-meta"><span>19:45</span><span>UEFA Nations League</span></div>
              <div className="match-team"><b className="flag">🇱🇻</b><span>Latvia</span></div>
              <div className="match-team"><b className="flag">🇨🇾</b><span>Cyprus</span></div>
            </div>
            <div className="match-markets">
              <OddButton label="1" value="2.72" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
              <OddButton label="X" value="3.10" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
              <OddButton label="2" value="2.85" selectedOdds={selectedOdds} onToggle={toggleOdd} match={searchableMatches[1]} />
            </div>
          </article>
        </section>
          </>
        )}
      </div>

      {!authMode && !slipOpen && activeBottom === 'bet360' && selectedOdds.length > 0 && (
        <button
          className="slip-button"
          type="button"
          aria-label={`${selectedOdds.length} selections in bet slip`}
          onClick={() => {
            setSlipMessage('')
            setSlipOpen(true)
          }}
        >
          <span className="slip-icon">▤</span>
          <strong>{selectedOdds.length}</strong>
          <span>Slip</span>
        </button>
      )}

      {!authMode && <nav className="bottom-nav" aria-label="Account navigation">
        {[
          ['bet360', '⚡'],
          ['My Bets', '▤'],
          ['Me', '♙'],
        ].map(([item, icon]) => (
          <button
            className={activeBottom === item ? 'active' : ''}
            key={item}
            type="button"
            onClick={() => {
              setActiveBottom(item)
              setSlipOpen(false)
              if (item !== 'Me') setDepositOpen(false)
            }}
          >
            <span className="bottom-icon">{icon}</span>
            <span>{item}</span>
          </button>
        ))}
      </nav>}
    </main>
  )
}

export default App
