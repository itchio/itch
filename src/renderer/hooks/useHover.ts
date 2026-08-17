import React, { useCallback, useState } from "react";

export interface HoverProps {
  hover: boolean;
  onMouseEnter?: React.EventHandler<React.MouseEvent<any>>;
  onMouseLeave?: React.EventHandler<React.MouseEvent<any>>;
}

export function useHover(): HoverProps {
  const [hover, setHover] = useState(false);
  const onMouseEnter = useCallback(() => setHover(true), []);
  const onMouseLeave = useCallback(() => setHover(false), []);
  return { hover, onMouseEnter, onMouseLeave };
}
