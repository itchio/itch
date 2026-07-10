import { fileSize } from "common/format/filesize";
import FormattedDuration from "renderer/basics/FormattedDuration";
import { T } from "renderer/t";

interface Props {
  bps?: number;
  eta?: number;
  downloadsPaused: boolean;
  onlyBPS?: boolean;
  onlyETA?: boolean;
}

export default function DownloadProgressSpan({
  bps,
  eta,
  downloadsPaused,
  onlyBPS,
  onlyETA,
}: Props): JSX.Element | null {
  if (downloadsPaused) {
    return <>{T(["grid.item.downloads_paused"])}</>;
  }

  if (onlyBPS) {
    if (bps === undefined) {
      return null;
    }
    return (
      <>
        {fileSize(bps)}
        /s
      </>
    );
  }

  if (onlyETA) {
    if (eta === undefined) {
      return null;
    }
    return <FormattedDuration secs={eta} />;
  }

  const hasBPS = bps !== undefined && bps > 0;
  const hasETA = eta !== undefined && eta > 0;
  return (
    <span>
      {hasBPS ? (
        <>
          {fileSize(bps)}
          {"/s"}
        </>
      ) : null}
      {hasBPS && hasETA ? " — " : null}
      {hasETA ? <FormattedDuration secs={eta} /> : null}
    </span>
  );
}
