import { IProgressListener } from "../types";

/**
 * Returns a function that, when called, calls onProgress
 * with an find object that has a percent value scaled to go from
 * start to end.
 *
 * Example:
 *
 *   // from 20% to 40%, we do that
 *   await subtask(src, dst, {onProgress: subprogress(onProgress, 0.2, 0.4)})
 */
export default function subprogress(
  onProgress: IProgressListener,
  startAlpha: number,
  endAlpha: number
): IProgressListener {
  const spanAlpha = endAlpha - startAlpha;

  return function(e) {
    const innerAlpha = e.progress;
    const progress = startAlpha + innerAlpha * spanAlpha;

    // TODO: what about bps/eta?
    onProgress({ ...e, progress });
  };
}
