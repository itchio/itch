
import { Transform } from "stream";

class LFTransform extends Transform {
  _transform(chunk: any, encoding: any, done: () => void) {
    let data = chunk.toString();
    this.push(data.replace(/\r/g, ""));
    done();
  }
}

export default LFTransform;
