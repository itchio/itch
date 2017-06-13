
// tslint:disable:no-shadowed-variable

import * as ospath from "path";
import * as test from "zopf";
import * as paths from "../../os/paths";
import {app} from "electron";

import preferencesReducer from "../../reducers/preferences";

import {IUploadRecord} from "../../types";

test("pathmaker", t => {
  t.case("downloadPath", t => {
    const preferences = preferencesReducer(undefined, {type: "BOOT"});

    t.same(paths.downloadPath({
      filename: "voices.tar.gz",
      id: 1990,
    } as any as IUploadRecord, preferences), ospath.join(app.getPath("userData"), "downloads", "1990.tar.gz"));
    t.same(paths.downloadPath({
      filename: "FACES OF WRATH.TAR.BZ2",
      id: 1997,
    } as any as IUploadRecord, preferences), ospath.join(app.getPath("userData"), "downloads", "1997.tar.bz2"));
    t.same(paths.downloadPath({
      filename: "2019.07.21.zip",
      id: 1990,
    } as any as IUploadRecord, preferences), ospath.join(app.getPath("userData"), "downloads", "1990.zip"));
    t.same(paths.downloadPath({
      filename: "the-elusive-extless-file",
      id: 1994,
    } as any as IUploadRecord, preferences), ospath.join(app.getPath("userData"), "downloads", "1994"));
  });
});
