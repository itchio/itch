
let keyMirror = require('keymirror')
let State = keyMirror({
  NORMAL: null,
  EXPECT_COMPONENT_KEY: null,
  EXPECT_CLOSE: null
})

module.exports = (t, key, components, text_vars) => {
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
  // and then replace `[[button]]` with the actual component
  // passed to us in components['button']
  for (let component_key of Object.keys(components)) {
    vars[component_key] = '[[' + component_key + ']]'
  }

  let result = []
  let translated = t(key, vars)
  // example: ["Click on ", "[[", "report", "]]", " or ", "[[", "probe", "]]", ""]
  let tokens = translated.split(/(\[\[|\]\])/)
  let state = State.NORMAL

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i]

    if (state === State.NORMAL) {
      if (token === '[[') {
        state = State.EXPECT_COMPONENT_KEY
      } else {
        if (token.length) result.push(token)
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
