export function formatExitCode(code: number): string {
  const dec = code.toString(10);
  const hex = (code.toString(16) as any).padStart(8, "0");
  return `${dec} (0x${hex})`;
}
