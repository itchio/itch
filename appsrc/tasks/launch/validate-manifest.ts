
// TODO: refactor to use some shape matching library,

import { each } from "underscore";

import { IManifest } from "../../types";

const MANIFEST_REQUIRED_FIELDS = [
  "actions",
];

const MANIFEST_VALID_FIELDS = [
  "actions", // list of action `[[actions]]` blocks
  "prereqs",
];

const ACTION_REQUIRED_FIELDS = [
  "name",
  "path",
];

const ACTION_VALID_FIELDS = [
  "name", // human-readable or standard name
  "path", // file path (relative to manifest), URL, etc.
  "icon", // icon name (see static/fonts/icomoon/demo.html, don't include `icon-` prefix)
  "args", // command-line arguments
  "sandbox", // sandbox opt-in
  "scope", // requested API scope
];

const PREREQ_REQUIRED_FIELDS = [
  "name",
];

const PREREQ_VALID_FIELDS = [
  "name", // standard name
];

export default function validateManifest(manifest: IManifest, log: any, opts: any) {
  for (const field of Object.keys(manifest)) {
    if (MANIFEST_VALID_FIELDS.indexOf(field) === -1) {
      log(opts, `in manifest, unknown field '${field}' found`);
    }
  }

  for (const requiredField of MANIFEST_REQUIRED_FIELDS) {
    if (typeof (manifest as any)[requiredField] === "undefined") {
      throw new Error(`in manifest, required field '${requiredField}' is missing`);
    }
  }

  each(manifest.actions, (action, i) => {
    const denomination = action.name || `#${i}`;

    for (const field of Object.keys(action)) {
      if (ACTION_VALID_FIELDS.indexOf(field) === -1) {
        log(opts, `in manifest action ${denomination}, unknown field '${field}' found`);
      }
    }

    for (const requiredField of ACTION_REQUIRED_FIELDS) {
      if (typeof (action as any)[requiredField] === "undefined") {
        throw new Error(`in manifest action ${denomination}, required field '${requiredField}' is missing`);
      }
    }
  });

  each(manifest.prereqs, (prereq, i) => {
    const denomination = prereq.name || `#${i}`;

    for (const field of Object.keys(prereq)) {
      if (PREREQ_VALID_FIELDS.indexOf(field) === -1) {
        log(opts, `in manifest prereq ${denomination}, unknown field '${field}' found`);
      }
    }

    for (const requiredField of PREREQ_REQUIRED_FIELDS) {
      if (typeof (prereq as any)[requiredField] === "undefined") {
        throw new Error(`in manifest prereq ${denomination}, required field '${requiredField}' is missing`);
      }
    }
  });
}
