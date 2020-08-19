import React from "react";
import { Profile } from "common/butlerd/messages";
import { Subtract } from "common/types";

export interface ProfileContextProps {
  profile: Profile;
}

const profileContext = React.createContext<Profile>(undefined);
export const ProfileProvider = profileContext.Provider;
export const ProfileConsumer = profileContext.Consumer;

export const withProfile = <P extends ProfileContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, ProfileContextProps>) => (
  <ProfileConsumer>
    {(profile) => (
      <Component {...((props as unknown) as P)} profile={profile} />
    )}
  </ProfileConsumer>
);
