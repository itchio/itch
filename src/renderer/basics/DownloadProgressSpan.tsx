import { fileSize } from "common/format/filesize";
import React from "react";
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
}: Props): JSX.Element {
  if (downloadsPaused) {
    return <>{T(["grid.item.downloads_paused"])}</>;
  }

  if (onlyBPS) {
    return (
      <>
        {fileSize(bps)}
        /s
      </>
    );
  }

  if (onlyETA) {
    return <FormattedDuration secs={eta} />;
  }

  const hasBPS = bps > 0;
  const hasETA = eta > 0;
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
