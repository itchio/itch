
const debug = require("debug")("itch:compare-records");

export default function compareRecords (oldRecord: any, newRecord: any): boolean {
  for (const newKey in newRecord) {
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
            return false;
          }
        } else {
          debug(`${newKey} turned into a Date`);
        }
      } else {
        if (!compareRecords(oldVal, newVal)) {
          debug(`recursive comparison for ${newKey} was falsy`);
          return false;
        }
      }
    } else {
      if (oldVal !== newVal) {
        debug(`=== was false for ${newKey}`);
        return false;
      }
    }
  }

  return true;
};
