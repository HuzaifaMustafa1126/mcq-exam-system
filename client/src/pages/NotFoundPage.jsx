import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function NotFoundPage() {
  return <main className="aurora grid min-h-screen place-items-center p-6"><section className="glass max-w-md rounded-2xl p-8 text-center"><p className="text-sm font-semibold text-cyan-300">404</p><h1 className="mt-2 text-3xl font-bold">Page not found</h1><p className="mt-3 text-sm leading-6 text-zinc-400">The page you requested does not exist or is no longer available.</p><Link to="/"><Button className="mt-6">Back to home</Button></Link></section></main>
}
