import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'
import App from './App'
import { api } from './api'

vi.mock('./api', () => ({
  api: {
    clusterStatus: vi.fn().mockResolvedValue({
      built: true,
      build_dir: '/tmp/build',
      num_parties: 0,
      protocol: null,
      protocols_available: ['dh_psi', 'ks05_t_mpsi'],
      dealer: { pid: null, running: false, listening: false, port: 53000 },
      parties: [],
    }),
  },
  formatApiError: vi.fn(),
  formatApiProblem: vi.fn(),
}))

vi.mock('./components/ClusterCard', () => ({
  ClusterCard: () => <div>cluster-controls</div>,
}))
vi.mock('./components/DemoPanel', () => ({
  DemoPanel: () => <div>quick-workspace</div>,
}))
vi.mock('./components/PracticalPanel', () => ({
  PracticalPanel: () => <div>participant-workspace</div>,
}))
vi.mock('./components/InfoPages', () => ({
  WhyPsiPage: () => <main>why-page</main>,
  GuidePage: () => <main>guide-page</main>,
  ProjectPage: () => <main>project-page</main>,
  ProtocolsPage: () => <main>protocols-page</main>,
}))

describe('application shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
    vi.mocked(api.clusterStatus).mockResolvedValue({
      built: true,
      build_dir: '/tmp/build',
      num_parties: 0,
      protocol: null,
      protocols_available: ['dh_psi', 'ks05_t_mpsi'],
      dealer: { pid: null, running: false, listening: false, port: 53000 },
      parties: [],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens the recommended quick run and reports readiness', async () => {
    render(<App />)

    expect(screen.getByText('quick-workspace')).toBeInTheDocument()
    expect(await screen.findByText('Ready to run')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quick local run/ })).toHaveClass('active')
  })

  it('switches to participant mode and remembers the choice', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Connect a participant/ }))

    expect(screen.getByText('participant-workspace')).toBeInTheDocument()
    expect(window.localStorage.getItem('psinsieme.runMode')).toBe('participant')
  })

  it('keeps legacy learning hashes working', () => {
    window.location.hash = '#guide'
    render(<App />)

    expect(screen.getByText('guide-page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guide' })).toHaveClass('active')
  })

  it('has no detectable structural accessibility violations', async () => {
    render(<App />)
    await screen.findByText('Ready to run')

    const result = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })

    await waitFor(() => expect(result.violations).toEqual([]))
  })
})
