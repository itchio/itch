const noiseRe = /(window|tick|locale|Progress|commons)/;

function shouldLogAction(action: any): boolean {
  return !noiseRe.test(action.type);
}
export default shouldLogAction;
