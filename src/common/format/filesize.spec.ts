import { describe, it, assert } from "test";

import { fileSize } from "./filesize";

describe("filesize", () => {
  it("fileSize", () => {
    assert.equal(fileSize(1023), "1023 B");
    assert.equal(fileSize(234090), "229 KiB");
    assert.equal(fileSize(6934028), "6.6 MiB");
    assert.equal(fileSize(239502889), "228 MiB");
    assert.equal(fileSize(2395028891), "2.2 GiB");
  });
});
