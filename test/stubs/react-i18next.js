
/**
 * Used like this:
 *
 * module.exports = translate(['namespace1', 'namespace2'])(MyComponent)
 *
 * cf. https://github.com/i18next/react-i18next
 */
let self = {
  translate: (ns) => {
    return (x) => {
      return x
    }
  }
}

module.exports = self
