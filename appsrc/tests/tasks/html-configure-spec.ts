
// tslint:disable:no-shadowed-variable

import test = require("zopf");

import fixture from "../fixture";
import {each} from "underscore";

import html from "../../tasks/configure/html";

test("html-configure", (t) => {
  const cases = [
    { desc: "nested index.html", path: "configure/html/nested", expects: "ThisContainsStuff/index.html" },
    { desc: "many html files", path: "configure/html/many", expects: "index.html" },
  ];

  each(cases, (caseDef) => {
    const htmlPath = fixture.path(caseDef.path);

    t.case(`picks correct .html entry point (${caseDef.desc})`, async function (t) {
      const res = await html.getGamePath(htmlPath);
      t.same(res, caseDef.expects);
    });
  });
});
