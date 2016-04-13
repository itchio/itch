
import colorgram from 'colorgram'
import tinycolor from 'tinycolor2'
import {filter} from 'underline'

const width = 400
const PRINT_COLORS = !!process.env.IAMA_RAINBOW_AMA

const cache = {}

export default function getDominantColor (path, done) {
  if (!path) return

  if (cache[path]) return done(cache[path])

  const img = new window.Image()
  img.onload = function () {
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width * (img.height / img.width)
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, canvas.height)
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const image = {width: canvas.width, height: canvas.height, data: id.data, channels: 4, canvas: canvas}
    const palette = colorgram.extract(image)
    cache[path] = palette
    done(palette)
  }
  img.src = path
}

getDominantColor.toCSS = (c) => c ? `rgb(${c[0]}, ${c[1]}, ${c[2]})` : null

getDominantColor.pick = (palette) => {
  const colors = palette.map((c) => ({
    rgb: c,
    hsl: tinycolor({r: c[0], g: c[1], b: c[2]}).toHsl()
  }))

  const picked = colors::filter((c) => c.hsl.l > 0.5 && c.hsl.l < 0.7)

  if (PRINT_COLORS) {
    console.log('picked colors: ', picked.length)
    picked.forEach((c) => {
      console.log(`%c ${JSON.stringify(c)}`, `color: ${getDominantColor.toCSS(c.rgb)}`)
    })
  }

  if (picked.length > 0) {
    return picked[0].rgb
  }
}
