
export function platform () {
  return process.platform
}

/**
 * Get platform in the format used by the itch.io API
 */
export function itch_platform () {
  switch (platform()) {
    case 'darwin':
      return 'osx'
    case 'win32':
      return 'windows'
    case 'linux':
      return 'linux'
  }
}

export function cli_args () {
  return process.argv
}

export default {
  platform,
  itch_platform,
  cli_args
}
