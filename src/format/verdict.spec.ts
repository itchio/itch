import suite from "../test-suite";

import { formatVerdict } from "./verdict";
import { Arch, Flavor } from "../buse/messages";

suite(__filename, s => {
  s.case("truncate", t => {
    const input = {
      basePath: "C:\\Users\\prince\\AppData\\Roaming\\itch\\apps\\inno",
      totalSize: 2285734,
      candidates: [
        {
          path: "WinVNC.exe",
          depth: 1,
          flavor: "windows" as Flavor,
          arch: "386" as Arch,
          size: 585728,
          windowsInfo: {
            gui: true,
          },
          mode: 0o644,
        },
        {
          path: "vncviewer.exe",
          depth: 1,
          flavor: "windows" as Flavor,
          arch: "386" as Arch,
          size: 380928,
          windowsInfo: {
            gui: true,
          },
          mode: 0o644,
        },
      ],
    };
    t.same(
      formatVerdict(input),
      [
        "| 2.2 MiB C:\\Users\\prince\\AppData\\Roaming\\itch\\apps\\inno",
        "|-- 572 KiB WinVNC.exe windows-386 win(gui)",
        "|-- 372 KiB vncviewer.exe windows-386 win(gui)",
      ].join("\n")
    );
  });
});
