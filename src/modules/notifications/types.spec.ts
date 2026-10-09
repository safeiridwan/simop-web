import { describe, expect, it } from 'vitest'

import { channelLabel, CHANNELS } from './types'

describe('notification type helpers', () => {
  it('labels channels', () => {
    expect(channelLabel('IN_APP')).toBe('Dalam Aplikasi')
    expect(channelLabel('EMAIL')).toBe('Email')
  })

  it('falls back to the raw value for unknown channels', () => {
    expect(channelLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the channel set', () => {
    expect(CHANNELS.map((c) => c.value)).toEqual(['IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'PUSH'])
  })
})
