import { formatDurationAsMessage } from "common/format/datetime";
import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
  /** A duration, in seconds */
  secs: number;
}

/**
 * Renders a human-friendly (and localized) duration.
 * Shows approximate time, with precise time on hover.
 */
export default ({ secs }: Props) => (
  <span data-rh={JSON.stringify({ duration: secs })}>
    <FormattedMessage {...formatDurationAsMessage(secs)} />
  </span>
);
