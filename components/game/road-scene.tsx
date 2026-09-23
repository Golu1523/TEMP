'use client'

import type { CSSProperties } from 'react'
import { multipliers, money, type GameState } from '@/lib/game/engine'

const vehicles = ['truck', 'icecream', 'taxi', 'firetruck', 'truck', 'taxi']
function Cover({ value, bright }: { value: number; bright: boolean }) {
  return <div className={`manhole ${bright ? 'next-cover' : ''}`}><div className="grille">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ height: `${76 - Math.abs(4 - i) * 7}px` }} />)}</div><span style={{ fontSize: value >= 100 ? 22 : 29 }}>{value.toFixed(2)}x</span></div>
}

export function RoadScene({ state, reducedMotion, fixture }: { state: GameState; reducedMotion: boolean; fixture: boolean }) {
  const camera = state.step >= 2 ? (state.step - 1) * 160 : 0
  const chickenX = state.step < 0 ? 72 : 238 + state.step * 160
  const values = multipliers[state.difficulty]
  return <section className={`road-scene ${reducedMotion ? 'reduced-motion' : ''} ${fixture ? 'fixture-scene' : ''}`} aria-label="Chicken crossing game" data-phase={state.phase} data-step={state.step}>
    <div className="scene-scale"><div className="road-world" style={{ transform: `translate3d(${-camera}px,0,0)` }}>
      <img className="pavement" src="/game/pavement.png" alt="" draggable={false} />
      {values.map((value, index) => {
        const completed = index < state.step || (state.phase === 'win' && index === state.step)
        const protectedLane = index <= state.step && state.phase !== 'idle' && !(state.losing && index === state.step)
        return <div className="road-lane" key={`${state.difficulty}-${index}`} style={{ left: 158 + index * 160 }}>
          <div className="cover-position">{completed ? <img className="gold-coin" src="/game/coin.png" alt="" /> : <Cover value={value} bright={index === state.step + 1} />}</div>
          {protectedLane && <img className="road-barrier" src="/game/barrier.png" alt="" />}
          {!protectedLane && !(state.losing && index === state.step) && <div className={`traffic-car ${index % 3 === 2 ? 'upward-car' : ''}`} style={{ '--travel-time': '8s', '--travel-delay': `${index % 3}s` } as CSSProperties}><img src={`/game/${vehicles[index % vehicles.length]}.png`} alt="" draggable={false} /></div>}
          {state.losing && index === state.step && <img key={`impact-${state.round}-${index}`} className={`impact-truck ${state.phase === 'hit' ? 'impact-ended' : ''}`} src="/game/truck.png" alt="" />}
        </div>
      })}
      <div className={`chicken-position ${state.phase === 'idle' ? 'chicken-idle' : ''}`} style={{ left: chickenX - 55 }}>
        <div className="chicken-shadow" />
        <img key={`${state.round}-${state.step}-${state.phase === 'hit' ? 'hit' : 'normal'}`} className={`chicken-sprite ${state.phase === 'hopping' ? 'chicken-hop' : ''} ${state.phase === 'hit' ? 'chicken-hit' : ''}`} src={state.phase === 'hit' ? '/game/hit.png' : '/game/chicken.png'} alt={state.phase === 'hit' ? 'Chicken hit by traffic' : 'Chicken'} draggable={false} />
        {state.step >= 0 && state.phase !== 'hit' && state.phase !== 'hopping' && <div className="multiplier-badge">{values[state.step].toFixed(2)}x</div>}
        {state.phase === 'hit' && <div className="feathers" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--feather-index': i } as CSSProperties} />)}</div>}
      </div>
    </div></div>
    {state.phase === 'win' && <div className="win-notice" role="status"><span>WIN!</span><strong>{money(state.payout)} <i className="dollar-coin">$</i></strong></div>}
  </section>
}
