
const keyMirror = require('keymirror')
const State = keyMirror({
  NORMAL: null,
  EXPECT_COMPONENT_KEY: null,
  EXPECT_CLOSE: null
})

function interleave (t, key, components, text_vars) {
  pre: { // eslint-disable-line
    typeof t === 'function'
    typeof key === 'string'
    typeof components === 'object'
  }

  if (typeof text_vars === 'undefined') {
    text_vars = {}
  }

  let vars = Object.assign({}, text_vars)
  // source string is something like:
  //
  //   'Click {{button}} to do X'
  //
  // we're trying to turn it into:
  //
  //   'Le bouton [[button]] sert à faire X'
  //
  // and then replace '[[button]]' with the actual component
  // passed to us in components['button']
  for (let component_key of Object.keys(components)) {
    vars[component_key] = '[[' + component_key + ']]'
  }

  const result = []
  const translated = t(key, vars)
  // example: ["Click on ", "[[", "report", "]]", " or ", "[[", "probe", "]]", ""]
  const tokens = translated.split(/(\[\[|\]\])/)

  let state = State.NORMAL

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (state === State.NORMAL) {
      if (token === '[[') {
        state = State.EXPECT_COMPONENT_KEY
      } else {
        if (token.length) {
          result.push(token)
        }
      }
    } else if (state === State.EXPECT_COMPONENT_KEY) {
      result.push(components[token])
      state = State.EXPECT_CLOSE
    } else if (state === State.EXPECT_CLOSE) {
      if (token !== ']]') {
        let msg = `Expected closing tag at ${i}, got '${token}' instead. ` +
        `All tokens = ${JSON.stringify(tokens, null, 2)}`
        throw new Error(msg)
      }
      state = State.NORMAL
    }
  }

  return result
}

export default interleave
