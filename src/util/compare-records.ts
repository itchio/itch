
const debug = require("debug")("itch:compare-records");

export default function compareRecords (oldRecord: any, newRecord: any, fields?: Set<string>): boolean {
  for (const newKey in newRecord) {
    if (fields && !fields.has(newKey)) {
      // we're ignoring this one
      continue;
    }

    if (!newRecord.hasOwnProperty(newKey)) {
      // that's okay, they're merged anyway
      continue;
    }
    if (!oldRecord.hasOwnProperty(newKey)) {
      // ah, it's a new key! record is fresh then
      debug(`new key ${newKey}`);
      return false;
    }

    const newVal = newRecord[newKey];
    const oldVal = oldRecord[newKey];
    const newType = typeof newVal;
    if (newType === "object") {
      if (newVal instanceof Date) {
        if (oldVal instanceof Date) {
          if (newVal.getTime() !== oldVal.getTime()) {
            debug(`different dates: old ${oldVal.toUTCString()}, new ${newVal.toUTCString()}`);
            debug(`to be precise, old time = ${oldVal.getTime()}, new time = ${newVal.getTime()}, diff = ${newVal.getTime() - oldVal.getTime()}`);
            return false;
          }
        } else {
          debug(`${newKey} turned into a Date`);
          return false;
        }
      } else {
        if (!compareRecords(oldVal, newVal)) {
          debug(`recursive comparison for ${newKey} was falsy`);
          return false;
        }
      }
    } else {
      if (oldVal !== newVal) {
        debug(`for ${newKey}, ${oldVal} !== ${newVal}`);
        return false;
      }
    }
  }

  return true;
};
