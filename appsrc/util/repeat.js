
export default function repeat (times) {
  let base = this
  let result = []
  for (let i = 0; i < times; i++) {
    result = result.concat(base)
  }
  return result
}
