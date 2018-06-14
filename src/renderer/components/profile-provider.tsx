import React from "react";

export interface ProfileIdContextProps {
  profileId: number;
}

const profileIdContext = React.createContext<number>(undefined);
export const ProfileIdProvider = profileIdContext.Provider;
export const ProfileIdConsumer = profileIdContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export const withProfileId = <P extends ProfileIdContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, ProfileIdContextProps>) => (
  <ProfileIdConsumer>
    {profileId => <Component {...props} profileId={profileId} />}
  </ProfileIdConsumer>
);
