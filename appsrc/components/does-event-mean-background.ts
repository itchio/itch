
export interface IWebkitMouseEvent extends React.MouseEvent<any> {
  which?: number;
}

export default function doesEventMeanBackground (e: IWebkitMouseEvent) {
  if (!e) {
    return false;
  }
  return e.metaKey || e.ctrlKey || e.which === 2;
}
