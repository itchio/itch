
import colorgram from 'colorgram'

const width = 400

export default function getDominantColor (path, done) {
  if (!path) return

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
    done(palette)
  }
  img.src = path
}

getDominantColor.toCSS = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`
