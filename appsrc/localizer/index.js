
export function getT (strings, lang) {
  const t = (key, variables) => {
    const langs = [lang, 'en']
    const keys = Array.isArray(key) ? key : [key]

    let string
    for (const lang of langs) {
      for (const key of keys) {
        const lstrings = strings[lang] || {}
        string = lstrings[key]
        if (string) break
      }

      if (string) break
    }

    if (!string) {
      // fallback
      const {defaultValue = key} = variables || {}
      return defaultValue
    }

    if (variables) {
      let result = string
      for (const varName of Object.keys(variables)) {
        // TODO: pre-parse strings for performance?
        // also this will leave {{blah}} in strings if they
        // don't have corresponding variables
        result = result.replace(new RegExp('{{' + varName + '}}', 'g'), variables[varName])
      }
      return result
    } else {
      return string
    }
  }

  t.format = (args) => {
    if (Array.isArray(args)) {
      return t.apply(null, args)
    } else {
      return args
    }
  }

  return t
}

export default { getT }
