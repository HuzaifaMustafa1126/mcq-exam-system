import clsx from 'clsx'
export default function Card({ children, className }) { return <section className={clsx('glass rounded-2xl', className)}>{children}</section> }
