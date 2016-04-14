
import ospath from 'path'
import fs from 'fs'

const localesPath = ospath.resolve(__dirname, '..', 'static', 'locales.json')
export default JSON.parse(fs.readFileSync(localesPath)).locales
