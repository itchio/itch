import { useContext } from "react";
import { tabContext } from "renderer/hocs/withTab";

/** Id of the tab this component is rendered in (see HubScene/Meats). */
export function useTab(): string {
  const tab = useContext(tabContext);
  if (tab === undefined) {
    throw new Error("useTab called outside of a TabProvider");
  }
  return tab;
}
