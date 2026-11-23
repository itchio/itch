import { useContext } from "react";
import { Profile } from "common/butlerd/messages";
import { profileContext } from "renderer/hocs/withProfile";

/** The logged-in profile. Only available post-login (see App/Layout). */
export function useProfile(): Profile {
  const profile = useContext(profileContext);
  if (!profile) {
    throw new Error("useProfile called without a logged-in profile");
  }
  return profile;
}
