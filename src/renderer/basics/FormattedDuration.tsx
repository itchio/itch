import { formatDurationAsMessage } from "common/format/datetime";
import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
  /** A duration, in seconds */
  secs: number;
}

/**
 * Renders a human-friendly (and localized) duration
 */
export default ({ secs }: Props) => (
  <FormattedMessage {...formatDurationAsMessage(secs)} />
);
