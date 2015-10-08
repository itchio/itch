
import Promise from 'bluebird'
let read_chunk = Promise.promisify(require('read-chunk'))

function buffer (buf) {
  // intel Mach-O executables start with 0xCEFAEDFE
  // (old PowerPC Mach-O executables started with 0xFEEDFACE)
  if (buf[0] === 0xCE && buf[1] === 0xFA && buf[2] === 0xED && buf[3] === 0xFE) {
    return 'mach-o executable'
  }

  // Mach-O universal binaries start with 0xCAFEBABE
  // it's Apple's 'fat binary' stuff that contains multiple architectures
  if (buf[0] === 0xCA && buf[1] === 0xFE && buf[2] === 0xBA && buf[3] === 0xBE) {
    return 'mach-o universal binary'
  }

  // ELF executables start with 0x7F454C46
  // (e.g. 0x7F + 'ELF' in ASCII)
  if (buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46) {
    return 'elf executable'
  }

  // Shell-script start with an interro-bang
  if (buf[0] === 0x23 && buf[1] === 0x21) {
    return 'shell script'
  }

  return false
}

buffer.path = function (file) {
  return read_chunk(file, 0, 8).then(buffer)
}

export default buffer
