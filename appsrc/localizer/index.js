
export function getT (strings, lang) {
  return (key, variables) => {
    const lstrings = strings[lang] || {}
    const string = lstrings[key]
    if (!string) {
      // fallback
      return key
    }

    if (variables) {
      let result = string
      for (const varName in Object.keys(variables)) {
        result = result.replace(new RegExp('{{' + varName + '}}', 'g'), variables[varName])
      }
      return result
    } else {
      return string
    }
  }
}

export default { getT }
