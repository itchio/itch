
import Promise from 'bluebird'
import fileType from 'file-type'
let readChunk = Promise.promisify(require('read-chunk'))

const EXT_RE = /\.([0-9a-z]+)$/i

function sniff (buf) {
  // intel Mach-O executables start with 0xCEFAEDFE or 0xCFFAEDFE
  // (old PowerPC Mach-O executables started with 0xFEEDFACE)
  if ((buf[0] === 0xCE || buf[0] === 0xCF) && buf[1] === 0xFA && buf[2] === 0xED && buf[3] === 0xFE) {
    return {
      ext: '',
      mime: 'application/octet-stream',
      macExecutable: true
    }
  }

  // Mach-O universal binaries start with 0xCAFEBABE
  // it's Apple's 'fat binary' stuff that contains multiple architectures
  if (buf[0] === 0xCA && buf[1] === 0xFE && buf[2] === 0xBA && buf[3] === 0xBE) {
    return {
      ext: '',
      mime: 'application/octet-stream',
      macExecutable: true
    }
  }

  // ELF executables start with 0x7F454C46
  // (e.g. 0x7F + 'ELF' in ASCII)
  if (buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46) {
    return {
      ext: '',
      mime: 'application/octet-stream',
      linuxExecutable: true
    }
  }

  // Shell scripts start with a shebang (#!)
  // https://en.wikipedia.org/wiki/Shebang_(Unix)
  if (buf[0] === 0x23 && buf[1] === 0x21) {
    return {
      ext: 'sh',
      mime: 'application/x-sh',
      macExecutable: true,
      linuxExecutable: true
    }
  }

  // MSI (Microsoft Installer Packages) have a well-defined magic number.
  if (buf[0] === 0xD0 && buf[1] === 0xCF &&
      buf[2] === 0x11 && buf[3] === 0xE0 &&
      buf[4] === 0xA1 && buf[5] === 0xB1 &&
      buf[6] === 0x1A && buf[7] === 0xE1) {
    return {
      ext: 'msi',
      mime: 'application/x-msi'
    }
  }

  return fileType(buf)
}

sniff.path = async function (file) {
  try {
    let ext
    let extMatches = EXT_RE.exec(file)
    if (extMatches) {
      ext = extMatches[1].toLowerCase()

      if (ext === 'dmg') {
        // compressed .dmg have wrong magic numbers, go by extension
        return {ext: 'dmg', mime: 'application/x-apple-diskimage'}
      }

      if (ext === 'jar') {
        // jar files are hard to distinguish from .zip files without listing their contents
        return {ext: 'jar', mime: 'application/java-archive', linuxExecutable: true, macExecutable: true}
      }
    }

    let buf = await readChunk(file, 0, 262)
    let sniffed = sniff(buf)

    if (sniffed) {
      return sniffed
    }

    if (ext) {
      return {ext, mime: null}
    }

    return null
  } catch (e) {
    if (e.code === 'ENOENT') {
      // probably a broken symlink
      return null
    }
    throw e
  }
}

export default sniff
