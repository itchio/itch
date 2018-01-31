const noiseRe = /(window|tick|locale|Datapoint|Progress|commons)/;

export default function shouldLogAction(action: any): boolean {
  return !noiseRe.test(action.type);
}
