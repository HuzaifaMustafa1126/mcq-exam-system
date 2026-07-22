import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
	const dialogRef = useRef(null)

	useEffect(() => {
		if (!open) return undefined
		const previousActiveElement = document.activeElement
		const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		const focusDialog = () => dialogRef.current?.querySelector(focusableSelector)?.focus()
		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				onClose()
				return
			}
			if (event.key !== 'Tab' || !dialogRef.current) return
			const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)]
			if (!focusable.length) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}
		document.body.classList.add('overflow-hidden')
		document.addEventListener('keydown', handleKeyDown)
		const focusTimer = window.setTimeout(focusDialog, 0)
		return () => {
			window.clearTimeout(focusTimer)
			document.body.classList.remove('overflow-hidden')
			document.removeEventListener('keydown', handleKeyDown)
			previousActiveElement?.focus?.()
		}
	}, [open, onClose])

	if (!open) return null

	return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
		<div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="glass flex max-h-[90vh] w-[95vw] min-w-0 flex-col overflow-hidden rounded-2xl sm:w-[90vw] lg:max-w-175">
			<header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:px-6">
				<h2 id="modal-title" className="min-w-0 pr-4 text-lg font-bold">{title}</h2>
				<button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-10 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" title="Close dialog"><X size={20} /></button>
			</header>
			<div className="min-h-0 overflow-y-auto p-4 sm:p-6 [&_textarea]:min-h-30 [&_textarea]:resize-y [&_form>div:last-child]:sticky [&_form>div:last-child]:bottom-0 [&_form>div:last-child]:flex-wrap [&_form>div:last-child]:gap-3 [&>div:last-child]:sticky [&>div:last-child]:bottom-0 [&>div:last-child]:flex-wrap [&>div:last-child]:gap-3">{children}</div>
		</div>
	</div>
}
