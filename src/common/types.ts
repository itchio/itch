/**
 * Localized messages can be just a string, or an Array arranged like so:
 * [key: string, params: {[name: string]: string}]
 */
export type LocalizedString =
  | string
  | { id: string; values?: Record<any, any> };
