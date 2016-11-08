
interface IWebkitMouseEvent extends React.MouseEvent<any> {
  which?: number;
}

export default function doesEventMeanBackground (e: IWebkitMouseEvent) {
  return e.metaKey || e.ctrlKey || e.which === 2;
}
