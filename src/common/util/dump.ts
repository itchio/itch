export default function dump(obj: any): string {
  return JSON.stringify(obj, null, 2);
}
