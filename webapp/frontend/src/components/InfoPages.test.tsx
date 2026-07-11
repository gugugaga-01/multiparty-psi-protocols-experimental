import { fireEvent, render, within } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../I18nProvider'
import { WhyPsiPage } from './InfoPages'

function renderLearn() {
  window.localStorage.clear()
  return render(<I18nProvider><WhyPsiPage /></I18nProvider>)
}

describe('application example walkthrough', () => {
  it('reveals each example progressively and resets when the scenario changes', () => {
    const { container } = renderLearn()
    const explorer = container.querySelector('.application-lab-card')
    expect(explorer).not.toBeNull()
    const example = within(explorer as HTMLElement)

    expect(example.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(example.getByRole('tab', { name: /The data sets/ })).toHaveAttribute('aria-selected', 'true')
    expect(example.getByRole('button', { name: 'Previous step' })).toBeDisabled()
    expect(container.querySelectorAll('.scenario-chip.is-neutral')).toHaveLength(8)

    fireEvent.click(example.getByRole('button', { name: 'Continue' }))
    expect(example.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(example.getByRole('tab', { name: /The purpose/ })).toHaveAttribute('aria-selected', 'true')
    expect(example.getByText('Send matched risk markers for expert review or genetic counseling.')).toBeInTheDocument()
    expect(container.querySelectorAll('.scenario-chip.is-match')).toHaveLength(0)

    fireEvent.click(example.getByRole('tab', { name: /How intersection helps/ }))
    expect(example.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(container.querySelectorAll('.scenario-chip.is-match').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.scenario-chip.is-protected').length).toBeGreaterThan(0)
    expect(container.querySelector('.scene-outcome-strip')).toHaveClass('is-visible')

    fireEvent.click(example.getByRole('tab', { name: /What is revealed/ }))
    expect(example.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(container.querySelector('.scene-outcome-strip')).toHaveClass('is-visible')
    expect(container.querySelector('.privacy-card.output')).toHaveClass('is-visible')
    expect(container.querySelector('.privacy-card.risk')).toHaveClass('is-visible')
    expect(container.querySelector('.privacy-card.psi')).toHaveClass('is-visible')
    expect(example.getByRole('button', { name: 'Replay example' })).toBeInTheDocument()

    fireEvent.click(example.getByRole('tab', { name: 'Contact discovery' }))
    expect(example.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(example.getByRole('heading', { name: 'Contact discovery' })).toBeInTheDocument()
  })

  it('keeps the restored Learn page structurally accessible', async () => {
    renderLearn()
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    expect(result.violations).toEqual([])
  })
})
