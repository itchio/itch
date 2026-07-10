import React from "react";
import { Profile } from "common/butlerd/messages";
import { Subtract } from "common/types";

export interface ProfileContextProps {
  profile: Profile;
}

const profileContext = React.createContext<Profile | null>(null);
export const ProfileProvider = profileContext.Provider;
export const ProfileConsumer = profileContext.Consumer;

// Contract: withProfile consumers only mount post-login, under a
// ProfileProvider (see App/Layout). The throw below formalizes the
// crash that already happened downstream when that contract was broken.
export const withProfile =
  <P extends ProfileContextProps>(Component: React.ComponentType<P>) =>
  (props: Subtract<P, ProfileContextProps>) =>
    (
      <ProfileConsumer>
        {(profile) => {
          if (!profile) {
            throw new Error(
              "withProfile mounted without a logged-in profile (missing ProfileProvider?)"
            );
          }
          return <Component {...(props as unknown as P)} profile={profile} />;
        }}
      </ProfileConsumer>
    );
