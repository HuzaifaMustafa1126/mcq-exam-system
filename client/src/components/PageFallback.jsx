import Loader from './Loader'

/** Shared route fallback to keep lazy routes accessible and visually consistent. */
export default function PageFallback() {
  return <Loader text="Loading page…" />
}
