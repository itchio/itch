interface ITruncateOpts {
  length: number;
}

/**
 * Returns a truncated version of input. The output length will not exceed
 * opts.length.
 */
export function truncate(input: string, opts: ITruncateOpts): string {
  if (input.length > opts.length) {
    return input.substr(0, opts.length - 3) + "...";
  }
  return input;
}
