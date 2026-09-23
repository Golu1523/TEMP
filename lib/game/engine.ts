export const difficulties = ['Easy', 'Medium', 'Hard', 'Hardcore'] as const
export type Difficulty = typeof difficulties[number]
export type Phase = 'idle' | 'hopping' | 'safe' | 'hit' | 'win'

export const multipliers: Record<Difficulty, number[]> = {
  Easy: [1.01, 1.03, 1.06, 1.10, 1.15, 1.19, 1.24, 1.30, 1.35, 1.42, 1.48, 1.56, 1.65, 1.75, 1.86, 2, 2.16, 2.35, 2.58, 2.85],
  Medium: [1.09, 1.21, 1.35, 1.51, 1.70, 1.93, 2.21, 2.55, 2.97, 3.5, 4.17, 5.04, 6.2, 7.8, 10.05, 13.36],
  Hard: [1.18, 1.46, 1.83, 2.31, 2.95, 3.82, 5.02, 6.66, 9.04, 12.52, 17.74, 25.80, 38.71, 60.21],
  Hardcore: [1.63, 2.80, 4.95, 9.12, 17.63, 36.31, 80.66, 196.93, 541.56, 1733],
}
export const lossChance: Record<Difficulty, number> = { Easy: .045, Medium: .10, Hard: .17, Hardcore: .33 }
export type GameState = { phase: Phase; balance: number; stake: number; difficulty: Difficulty; step: number; losing: boolean; payout: number; round: number }
export const initialState: GameState = { phase: 'idle', balance: 99997600, stake: 300, difficulty: 'Hard', step: -1, losing: false, payout: 0, round: 0 }
export type Action = { type: 'stake'; value: number } | { type: 'difficulty'; value: Difficulty } | { type: 'advance'; losing: boolean } | { type: 'land' } | { type: 'cashout' } | { type: 'reset' } | { type: 'fixture'; state: GameState }
export function calculatePayout(stake: number, multiplier: number) { return Math.round(stake * multiplier) }
export function money(cents: number) { return (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false }) }
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'stake': return state.phase === 'idle' && Number.isInteger(action.value) && action.value >= 100 && action.value <= Math.min(20000, state.balance) ? { ...state, stake: action.value } : state
    case 'difficulty': return state.phase === 'idle' ? { ...state, difficulty: action.value } : state
    case 'advance': {
      if (state.phase !== 'idle' && state.phase !== 'safe') return state
      if (state.phase === 'idle' && state.stake > state.balance) return state
      if (state.step + 1 >= multipliers[state.difficulty].length) return state
      return { ...state, phase: 'hopping', step: state.step + 1, losing: action.losing, balance: state.balance - (state.phase === 'idle' ? state.stake : 0), round: state.round + (state.phase === 'idle' ? 1 : 0) }
    }
    case 'land': return state.phase !== 'hopping' ? state : state.losing ? { ...state, phase: 'hit', payout: 0 } : { ...state, phase: 'safe', payout: calculatePayout(state.stake, multipliers[state.difficulty][state.step]) }
    case 'cashout': return state.phase === 'safe' ? { ...state, phase: 'win', balance: state.balance + state.payout } : state
    case 'reset': return state.phase === 'hit' || state.phase === 'win' ? { ...state, phase: 'idle', step: -1, payout: 0, losing: false } : state
    case 'fixture': return process.env.NODE_ENV !== 'production' ? action.state : state
    default: return state
  }
}
