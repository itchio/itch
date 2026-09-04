import React from "react";
import SvgIcon, { SvgIconProps } from "renderer/basics/icons/SvgIcon";

/** The website's "playlist_add" glyph, copied from its icomoon set (1024 grid). */
const PlaylistAddIcon = (props: SvgIconProps) => (
  <SvgIcon label="collections" {...props}>
    <path
      transform="scale(0.0234375)"
      d="M86 682v-84h340v84h-340zM768 598h170v84h-170v172h-86v-172h-170v-84h170v-172h86v172zM598 256v86h-512v-86h512zM598 426v86h-512v-86h512z"
    />
  </SvgIcon>
);

export default React.memo(PlaylistAddIcon);
