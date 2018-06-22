import React from "react";
import { Space } from "common/helpers/space";
import { Subtract } from "common/types";

export interface SpaceContextProps {
  space: Space;
}

const spaceContext = React.createContext<Space>(undefined);
export const SpaceProvider = spaceContext.Provider;
export const SpaceConsumer = spaceContext.Consumer;

export const withSpace = <P extends SpaceContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, SpaceContextProps>) => (
  <SpaceConsumer>
    {space => <Component {...props} space={space} />}
  </SpaceConsumer>
);
