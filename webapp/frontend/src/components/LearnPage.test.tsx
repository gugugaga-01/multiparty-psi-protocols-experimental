import { fireEvent, render, screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../I18nProvider'
import { GLOSSARY, HISTORY, LEARN_SOURCES, TOY_GROUP, TOY_ITEMS, modPow, toyToken } from '../learnContent'
import { LearnPage } from './LearnPage'

function renderLearn() {
  window.localStorage.clear()
  return render(<I18nProvider><LearnPage /></I18nProvider>)
}

describe('Learn content model', () => {
  it('keeps source IDs valid and bilingual content complete', () => {
    const sourceIds = new Set(LEARN_SOURCES.map((source) => source.id))
    expect(sourceIds.size).toBe(LEARN_SOURCES.length)
    expect(LEARN_SOURCES.every((source) => source.url.startsWith('https://'))).toBe(true)

    for (const entry of GLOSSARY) {
      expect(entry.term.en).toBeTruthy()
      expect(entry.term.zh).toBeTruthy()
      expect(entry.summary.en).toBeTruthy()
      expect(entry.summary.zh).toBeTruthy()
      expect(entry.sourceIds?.every((id) => sourceIds.has(id)) ?? true).toBe(true)
    }
    for (const event of HISTORY) {
      expect(event.sourceIds.every((id) => sourceIds.has(id))).toBe(true)
    }
  })

  it('uses a valid order-11 subgroup and produces equal double-blinded tokens', () => {
    expect(modPow(2, TOY_GROUP.q, TOY_GROUP.p)).toBe(1)
    for (const base of Object.values(TOY_ITEMS.bases)) {
      expect(modPow(base, TOY_GROUP.q, TOY_GROUP.p)).toBe(1)
    }

    const exponent = TOY_GROUP.aliceSecret * TOY_GROUP.bobSecret
    expect(toyToken('shared-42', exponent)).toBe(8)
    expect(toyToken('route-8', exponent)).toBe(6)
    expect(toyToken('alice-7', exponent)).toBe(12)
    expect(toyToken('bob-9', exponent)).toBe(4)
  })
})

describe('Learn page', () => {
  it('starts with essentials and supports search, filters, and progressive disclosure', () => {
    renderLearn()

    expect(screen.getByRole('heading', { name: 'Private intersection, without the magic words' })).toBeInTheDocument()
    expect(screen.getByText(/Privacy is a boundary/)).toBeInTheDocument()
    expect(screen.getByText(`${GLOSSARY.filter((entry) => entry.essential).length} terms shown`)).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search terms' }), { target: { value: 'OPRF' } })
    expect(screen.getByRole('heading', { name: 'Oblivious PRF (OPRF)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Programmable OPRF (OPPRF)' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search terms' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Security' }))
    expect(screen.getByRole('heading', { name: 'Semi-honest model' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Oblivious PRF (OPRF)' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show all terms' }))
    expect(screen.getByText(`${GLOSSARY.length} terms shown`)).toBeInTheDocument()
  })

  it('walks through the DH result and switches application cases', () => {
    renderLearn()
    fireEvent.click(screen.getByRole('tab', { name: 'Private measurement' }))
    expect(screen.getByText('Intersection size or an aggregate over matching rows')).toBeInTheDocument()

    const dh = screen.getByRole('heading', { name: 'Blind, exchange, blind again, compare' }).closest('.learn-dh-card')
    expect(dh).not.toBeNull()
    fireEvent.click(within(dh as HTMLElement).getByRole('tab', { name: /Blind twice/ }))
    expect(within(dh as HTMLElement).getByText('shared-42, route-8')).toBeInTheDocument()
  })

  it('has no detectable structural accessibility violations', async () => {
    renderLearn()
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    expect(result.violations).toEqual([])
  })
})
