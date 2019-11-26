import { describe, it, assert } from "test";

import { formatUploadTitleFancy } from "common/format/upload";
import { Upload } from "common/butlerd/messages";

describe("formatUploadTitleFancy", () => {
  it("uses displayName first", () => {
    let u = <Upload>{
      displayName: "Misstortion 1.3 (VST2/VST3)",
      filename: "misstortion-1.3-vst2-vst3.zip",
    };
    assert.equal(formatUploadTitleFancy(u), u.displayName);
  });

  it("cleans up filename", () => {
    let u = <Upload>{
      filename: "misstortion-1.3-vst2-vst3.zip",
    };
    assert.equal(formatUploadTitleFancy(u), "misstortion 1.3 vst2 vst3");
    u.filename = "i.like.using.dots.txt";
    assert.equal(formatUploadTitleFancy(u), "i.like.using.dots");
  });
});
