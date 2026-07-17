import { LoaderCircle } from 'lucide-react'
export default function Loader({ text = 'Loading...' }) { return <div className="flex min-h-48 items-center justify-center gap-3 text-zinc-400"><LoaderCircle className="animate-spin text-cyan-400" size={22}/>{text}</div> }
