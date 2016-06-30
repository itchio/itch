
export default function doesEventMeanBackground (e) {
  return e.metaKey || e.ctrlKey || e.which === 2
}
