import suite from "../test-suite";

import { fileSize } from "./filesize";

suite(__filename, s => {
  s.case("fileSize", t => {
    t.same(fileSize(1023), "1023 B");
    t.same(fileSize(234090), "229 KiB");
    t.same(fileSize(6934028), "6.6 MiB");
    t.same(fileSize(239502889), "228 MiB");
    t.same(fileSize(2395028891), "2.2 GiB");
  });
});
