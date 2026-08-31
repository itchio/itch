import React from "react";
import SvgIcon, { SvgIconProps } from "renderer/basics/icons/SvgIcon";

/** A jam jar with a heart label, for game jams. */
const JamJarIcon = (props: SvgIconProps) => (
  <SvgIcon label="jams" {...props}>
    <rect x="6.75" y="2.4" width="10.5" height="3" rx="1.2" />
    <path
      fillRule="evenodd"
      d="M8.3 6.3 h7.4 a2.4 2.4 0 0 1 2.4 2.4 v10.4 a2.4 2.4 0 0 1 -2.4 2.4
         h-7.4 a2.4 2.4 0 0 1 -2.4 -2.4 v-10.4 a2.4 2.4 0 0 1 2.4 -2.4 z
         M9.05 10.6 h5.9 a1 1 0 0 1 1 1 v3.4 a1 1 0 0 1 -1 1
         h-5.9 a1 1 0 0 1 -1 -1 v-3.4 a1 1 0 0 1 1 -1 z
         M12 15.5 c-1.55 -0.95 -2.5 -1.85 -2.5 -2.9 c0 -0.85 0.65 -1.5 1.45 -1.5
         c0.45 0 0.8 0.2 1.05 0.55 c0.25 -0.35 0.6 -0.55 1.05 -0.55
         c0.8 0 1.45 0.65 1.45 1.5 c0 1.05 -0.95 1.95 -2.5 2.9 z"
    />
  </SvgIcon>
);

export default React.memo(JamJarIcon);
