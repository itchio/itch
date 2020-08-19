interface Shape {
  [key: string]: Shape | boolean;
}

export function fillShape(input: any, shape: Shape): any {
  if (!input) {
    return input;
  }
  if (Array.isArray(input)) {
    const arr = input as any[];
    return arr.map((subInput) => fillShape(subInput, shape));
  }
  const keys = Object.keys(shape);
  let output: any = {};
  if (keys.length === 1 && keys[0] === "*") {
    const subShape = shape[keys[0]] as Shape;
    for (const k of Object.keys(input)) {
      output[k] = fillShape(input[k], subShape);
    }
    return output;
  }

  for (const k of keys) {
    const v = shape[k];
    if (v === true) {
      output[k] = input[k];
    } else {
      output[k] = fillShape(input[k], v as Shape);
    }
  }
  return output;
}
