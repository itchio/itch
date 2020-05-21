import { packets } from "common/packets";
import React, { useCallback, useState } from "react";
import { IconButton } from "renderer/basics/IconButton";
import { useListen } from "renderer/Socket";
import { SearchModal } from "renderer/Shell/SearchModal";
import { socket } from "renderer";

interface Props {}

export const SearchButton = (props: Props) => {
  const [open, setOpen] = useState(false);

  useListen(
    socket,
    packets.openSearch,
    () => {
      setOpen(true);
    },
    [setOpen]
  );

  const toggleOpen = useCallback(() => {
    setOpen((o) => !o);
  }, [setOpen]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <>
      {open ? <SearchModal onClose={onClose} /> : null}
      <IconButton
        className="topbar-item search"
        icon="search"
        onClick={toggleOpen}
      />
    </>
  );
};
