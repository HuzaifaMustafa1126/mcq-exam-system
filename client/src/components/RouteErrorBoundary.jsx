import { Component } from 'react'
import Button from './Button'

export default class RouteErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  componentDidCatch(error) { console.error('Route rendering failed', error) }

  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="grid min-h-screen place-items-center p-6"><section className="glass max-w-md rounded-2xl p-8 text-center"><p className="text-sm font-semibold text-rose-300">SOMETHING WENT WRONG</p><h1 className="mt-2 text-2xl font-bold">Unable to load this page</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Please refresh the page. If the problem continues, contact support.</p><Button className="mt-6" onClick={() => window.location.reload()}>Refresh page</Button></section></main>
  }
}
