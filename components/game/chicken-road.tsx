'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { Info, Maximize, Menu, Minimize, X, UserRound } from 'lucide-react'
import { RoadScene } from './road-scene'
import { difficulties, initialState, lossChance, money, multipliers, reducer, type GameState } from '@/lib/game/engine'

const feed = [
  { name: 'Neon111', win: '+€208.56', flag: 'pt' },
  { name: 'Rose Super R…', win: '+$292.00', flag: 'pk' },
  { name: 'Harlequin Int…', win: '+$442.00', flag: 'de' },
  { name: 'utuc7502', win: '+Rs9696.93', flag: 'pk' },
]

export function ChickenRoad() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [amount, setAmount] = useState('3')
  const [scale, setScale] = useState(1)
  const [feedIndex, setFeedIndex] = useState(-1)
  const [modal, setModal] = useState<'help' | 'settings' | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [full, setFull] = useState(false)
  const [notice, setNotice] = useState('')
  const [fixture, setFixture] = useState(false)
  const [safeTest, setSafeTest] = useState(false)
  const shell = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const locked = state.phase !== 'idle'
  const busy = state.phase === 'hopping' || state.phase === 'hit' || state.phase === 'win'
  const lastStep = state.step === multipliers[state.difficulty].length - 1

  useEffect(() => {
    const el = shell.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width < 700 ? 1 : entry.contentRect.width / 1125))
    observer.observe(el)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onFull = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFull)
    if (process.env.NODE_ENV !== 'production') {
      const params = new URLSearchParams(window.location.search)
      setSafeTest(params.get('test') === 'safe')
      const scene = params.get('scene')
      const scenes: Record<string, Partial<GameState>> = {
        idle: {}, first: { phase: 'safe', step: 0, payout: 354 }, second: { phase: 'safe', step: 1, payout: 438 }, third: { phase: 'safe', step: 2, payout: 549 }, hit: { phase: 'hit', step: 1, losing: true }, win: { phase: 'win', step: 2, payout: 549, balance: 99997849 },
      }
      if (scene && scene in scenes) {
        setFixture(true)
        dispatch({ type: 'fixture', state: { ...initialState, balance: scene === 'idle' ? initialState.balance : initialState.balance - 300, ...scenes[scene] } })
      }
    }
    return () => { observer.disconnect(); document.removeEventListener('fullscreenchange', onFull) }
  }, [])

  useEffect(() => {
    if (fixture) return
    const delay = state.phase === 'hopping' ? 420 : state.phase === 'hit' ? 1450 : state.phase === 'win' ? 2200 : 0
    if (!delay) return
    const timer = window.setTimeout(() => dispatch({ type: state.phase === 'hopping' ? 'land' : 'reset' }), delay)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.step, fixture])

  useEffect(() => {
    if (fixture || state.phase !== 'hopping') return
    const gameShell = shell.current
    if (!gameShell) return
    const chickenEl = gameShell.querySelector('.chicken-sprite')
    if (!chickenEl) return
    const rect = chickenEl.getBoundingClientRect()
    const lanes = gameShell.querySelectorAll('.road-lane')
    let hit = false
    lanes.forEach(lane => {
      const vehicles = lane.querySelectorAll('.traffic-car img')
      vehicles.forEach(v => {
        const vr = v.getBoundingClientRect()
        if (rect.left < vr.right - 20 && rect.right > vr.left + 20 && rect.top < vr.bottom - 10 && rect.bottom > vr.top + 10) {
          hit = true
        }
      })
    })
    if (hit) {
      dispatch({ type: 'advance', losing: true })
    }
  }, [state.phase, state.step, fixture])

  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) setFeedIndex(i => (i + 1) % feed.length) }, 5500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])

  function updateStake(value: string) {
    setAmount(value)
    const cents = Math.round(Number(value) * 100)
    if (value.trim() && cents >= 100 && cents <= Math.min(20000, state.balance)) {
      dispatch({ type: 'stake', value: cents })
      setNotice('')
    }
  }
  const validStake = amount.trim() !== '' && Number(amount) >= 1 && Number(amount) <= Math.min(200, state.balance / 100) && Number.isFinite(Number(amount))
  function advance() {
    if (busy || (!locked && !validStake)) return
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
    dispatch({ type: 'advance', losing: !safeTest && random < lossChance[state.difficulty] })
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await shell.current?.requestFullscreen()
    } catch { setNotice('Fullscreen is unavailable in this preview. Open the game in a new tab to use fullscreen.') }
  }
  const currentFeed = feed[Math.max(0, feedIndex)]

  return <main className="game-page">
    <div className="game-shell" ref={shell} style={{ '--game-scale': scale } as React.CSSProperties}>
      <div className="chicken-game">
        <header className="game-header">
          <img className="game-logo" src="/game/logo.png" alt="Chicken Road 2" width={201} height={38} />
          <div className="header-actions">
            <button className="help-button" onClick={() => setModal('help')} aria-label="How to play?"><Info size={17} /><span>How to play?</span></button>
            <div className="balance-box" aria-label={`Demo balance ${money(state.balance)} dollars`}><span>{(state.balance / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/\u202f/g, ' ')}</span><i className="dollar-coin">$</i></div>
            <button className="fullscreen-button" onClick={toggleFullscreen} aria-label={full ? 'Exit fullscreen' : 'Enter fullscreen'}>{full ? <Minimize size={20} /> : <Maximize size={20} />}</button>
            <button className="menu-button" onClick={() => setModal('settings')} aria-label="Game settings"><Menu size={27} strokeWidth={1.6} /></button>
          </div>
        </header>
        <div className="stage-wrap">
          <RoadScene state={state} reducedMotion={reducedMotion} fixture={fixture} />
          <aside className="live-feed" aria-label="Simulated live wins">
            <div className="live-feed-heading"><span>Live wins:</span><i /><span>Online:</span><b>{feedIndex < 2 ? '12053' : '12131'}</b></div>
            {feedIndex >= 0 && <div className="feed-entry" key={feedIndex}><span className="feed-avatar"><UserRound size={16} fill="currentColor" /><i className={`flag flag-${currentFeed.flag}`} /></span><b>{currentFeed.name}</b><strong>{currentFeed.win}</strong></div>}
          </aside>
        </div>
        <footer className="game-footer">
          <div className="control-panel">
            <fieldset className="stake-controls" disabled={locked} aria-label="Bet amount">
              <div className="stake-input"><button onClick={() => updateStake('1')}>MIN</button><input type="number" inputMode="decimal" aria-label="Bet amount" min="1" max="200" step="0.01" value={amount} onChange={e => updateStake(e.target.value)} onBlur={() => { if (!validStake) { setAmount(money(state.stake)); setNotice('Bet amount must be between 1 and 200 demo dollars, within your balance.') } }} /><button onClick={() => updateStake(String(Math.min(200, state.balance / 100)))}>MAX</button></div>
              <div className="stake-presets">{[2, 3, 8, 20].map(value => <button key={value} onClick={() => updateStake(String(value))} aria-label={`Bet ${value} dollars`}>{value}<i className="dollar-coin">$</i></button>)}</div>
            </fieldset>
            <fieldset className="difficulty-controls" disabled={locked}>
              <div className="difficulty-heading"><legend>Difficulty</legend><span>Chance of being shot down</span></div>
              <div className="difficulty-segments" role="radiogroup" aria-label="Difficulty">{difficulties.map(value => <label className={state.difficulty === value ? 'selected' : ''} key={value}><input type="radio" name="difficulty" value={value} checked={state.difficulty === value} onChange={() => dispatch({ type: 'difficulty', value })} /><span>{value}</span></label>)}</div>
            </fieldset>
            <div className={`game-actions ${locked ? 'split-actions' : ''}`}>
              {locked && <button className="cashout-button" onClick={() => dispatch({ type: 'cashout' })} disabled={busy}>CASH OUT<span>{money(state.phase === 'hit' ? 0 : state.payout)} $</span></button>}
              <button className="play-button" onClick={advance} disabled={busy || (locked && lastStep) || (!locked && !validStake)}>{locked ? 'GO' : 'Play'}</button>
            </div>
          </div>
        </footer>
        <div className="sr-only" aria-live="polite">{state.phase === 'safe' ? `Safe! ${multipliers[state.difficulty][state.step]} times. Cash out ${money(state.payout)} dollars.` : state.phase === 'hit' ? 'Hit! Round lost. Try again.' : state.phase === 'win' ? `Won ${money(state.payout)} demo dollars.` : ''}</div>
      </div>
    </div>
    {notice && <div className="game-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    <dialog className="game-dialog" ref={dialog} onCancel={() => setModal(null)} onClick={e => { if (e.target === e.currentTarget) setModal(null) }} aria-labelledby="dialog-title">
      <div className="dialog-heading"><h1 id="dialog-title">{modal === 'help' ? 'How to play?' : 'Game settings'}</h1><button onClick={() => setModal(null)} aria-label="Close dialog"><X size={22} /></button></div>
      {modal === 'help' ? <div className="help-content"><p>One chicken. A busy road. How far will you go?</p><ol><li><b>Set your bet.</b> Choose 1–200 demo dollars and a difficulty.</li><li><b>Press Play.</b> Your bet is deducted and the first crossing begins.</li><li><b>Keep going.</b> Each safe crossing increases your multiplier. Higher difficulties carry more risk.</li><li><b>Cash out.</b> Collect the displayed amount before traffic catches you. A collision loses the round.</li></ol><div className="demo-disclosure"><b>Virtual-money demo</b><p>No deposits, withdrawals, or real-money prizes. Balance resets on reload. Live wins and online counts are simulated. Odds and some multiplier tables are recreated demo rules, not the original game&apos;s rules.</p></div></div> : <div className="settings-content"><label className="motion-setting"><span><b>Reduced motion</b><small>Pause ambient traffic and soften movement.</small></span><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} /></label><div className="demo-disclosure"><b>Demo session</b><p>All balances and wins are virtual. No account or payment required. Original game audio is not included.</p></div><button className="dialog-help" onClick={() => setModal('help')}>How to play <Info size={16} /></button></div>}
      <button className="dialog-done" onClick={() => setModal(null)}>Got it</button>
    </dialog>
  </main>
}
