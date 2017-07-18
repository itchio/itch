import { Column, Model } from "./model";
import { fromDateTimeField, toDateTimeField } from "./datetime-field";
import { fromJSONField, toJSONField } from "./json-field";

import deepEqual = require("deep-equal");

/**
 * Given an schema, an old record and a new record
 * @param oldRecord 
 * @param newRecord 
 * @param model 
 */
export function updateFor(oldRecord: any, newRecord: any, model: Model): any {
  let result: any = null;
  const { primaryKey, columns } = model;

  for (const key of Object.keys(newRecord)) {
    if (key === primaryKey) {
      continue;
    }

    const type = columns[key];
    if (!type) {
      // ignore keys that aren't in the schema
      continue;
    }

    const newValue = newRecord[key];
    const oldValue = oldRecord[key];

    let use = false;
    if (!oldRecord.hasOwnProperty(key)) {
      // old record didn't have, adding!
      use = true;
    } else {
      switch (type) {
        case Column.Integer:
          use = parseInt(newValue, 10) !== parseInt(oldValue, 10);
          break;
        case Column.Boolean:
          use = !!newValue !== !!oldValue;
          break;
        case Column.Text:
          use = newValue !== oldValue;
          break;
        case Column.DateTime: {
          const lhs = fromDateTimeField(oldValue);
          const rhs = fromDateTimeField(newValue);
          if (!lhs || !rhs) {
            use = true;
          } else {
            use = lhs.getTime() !== rhs.getTime();
          }
          break;
        }
        case Column.JSON: {
          const lhs = fromJSONField(oldValue);
          const rhs = fromJSONField(newValue);
          if (!lhs || !rhs) {
            use = true;
          } else {
            use = !deepEqual(lhs, rhs);
          }
          break;
        }
        default:
          use = !deepEqual(oldValue, newValue);
      }
    }

    if (use) {
      result = result || {};
      result[key] = toDB(newValue, type);
    }
  }
  return result;
}

export function insertFor(newRecord: any, model: Model) {
  let result: any = null;
  const { columns } = model;

  for (const key of Object.keys(newRecord)) {
    const type = columns[key];
    if (type) {
      result = result || {};
      result[key] = toDB(newRecord[key], type);
    }
  }

  return result;
}

export function toDB(newValue: any, type: Column): any {
  if (typeof newValue === "undefined") {
    return null;
  }

  switch (type) {
    case Column.DateTime:
      return toDateTimeField(newValue);
    case Column.JSON:
      return toJSONField(newValue);
    case Column.Boolean:
      return newValue ? 1 : 0;
    default:
      return newValue;
  }
}

export function updateQuery(model: Model, primaryValue: any, newFields: any) {
  let query = `UPDATE ${model.table} SET `;
  for (const key of Object.keys(newFields)) {
    query += `${key} = $${key} `;
  }
  query += `WHERE ${model.primaryKey} = ${JSON.stringify(primaryValue)}`;
  return query;
}

export function insertQuery(model: Model, primaryValue: any, newFields: any) {
  let query = `INSERT INTO ${model.table}`;
  const keys = Object.keys(newFields);
  query += ` (${keys.join(",")})`;
  query += ` VALUES (${keys.map(k => "$" + k).join(",")})`;
  return query;
}
