import React, { useEffect, useState } from "react";
import { FormattedRelativeTime } from "react-intl";
import { selectUnit } from "@formatjs/intl-utils";

interface Props {
  /// Date either as a number of milliseconds since epoch, or
  /// as an RFC3339-nano formatted string.
  date: number | string;
  className?: string;
  before?: string | JSX.Element;
}

export const TimeAgo = (props: Props) => {
  const { className, before, date } = props;

  let dateNumber: number = typeof date === "number" ? date : +new Date(date);
  let dateString: string =
    typeof date === "number" ? new Date(date).toISOString() : date;
  const { value, unit } = selectUnit(dateNumber);

  // used to force-rerender every 30s-33s
  const [, setDisplayNumber] = useState(0);
  useEffect(() => {
    let jitter = Math.random() * 3000;
    let interval = setInterval(() => {
      setDisplayNumber(x => x + 1);
    }, 30 * 1000 + jitter);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`time-ago ${className}`} title={dateString}>
      {before ? <>{before} </> : null}
      <FormattedRelativeTime
        unit={unit}
        value={value}
        numeric="auto"
        style="long"
      />
    </span>
  );
};
