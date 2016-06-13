
import mklog from '../log'
const log = mklog('sandbox-common')

export async function tendToNeeds (opts, needs, caretakers) {
  const errors = []

  for (const need of needs) {
    log(opts, `tending to need ${JSON.stringify(need)}`)
    const caretaker = caretakers[need.type]
    if (!caretaker) {
      errors.push(`don't know how to fulfill need ${need}`)
    } else {
      try {
        await Promise.resolve(caretaker(need))
      } catch (e) {
        errors.push(e)
      }
    }
  }

  return {errors}
}

export default {tendToNeeds}
