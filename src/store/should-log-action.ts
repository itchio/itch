const noiseRe = /(WINDOW_|TICK|LOCALE_|_DATAPOINT|_PROGRESS)/;

export default function shouldLogAction(action: any): boolean {
  return !noiseRe.test(action.type);
}
