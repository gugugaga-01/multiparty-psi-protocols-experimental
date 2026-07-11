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
    expect(example.getByRole('tab', { name: /Meet the parties/ })).toHaveAttribute('aria-selected', 'true')
    expect(example.getByRole('button', { name: 'Previous step' })).toBeDisabled()

    fireEvent.click(example.getByRole('button', { name: 'Continue' }))
    expect(example.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(example.getByRole('tab', { name: /Try plaintext/ })).toHaveAttribute('aria-selected', 'true')
    expect(container.querySelectorAll('.scenario-chip.is-match').length).toBeGreaterThan(0)
    expect(container.querySelector('.privacy-card.risk')).toHaveClass('is-visible')
    expect(container.querySelector('.privacy-card.psi')).not.toHaveClass('is-visible')

    fireEvent.click(example.getByRole('tab', { name: /Apply PSI/ }))
    expect(example.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(container.querySelectorAll('.scenario-chip.is-protected').length).toBeGreaterThan(0)
    expect(container.querySelector('.privacy-card.psi')).toHaveClass('is-visible')

    fireEvent.click(example.getByRole('tab', { name: /Use the result/ }))
    expect(example.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(container.querySelector('.scene-outcome-strip')).toHaveClass('is-visible')
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
