import { Profile } from "@itchio/valet/messages";
import { useContext, createContext } from "react";

export const OptionalProfileContext = createContext<Profile | undefined>(
  undefined
);
export const ProfileContext = createContext<Profile>(null as any);

export const useOptionalProfile = () => useContext(OptionalProfileContext);
export const useProfile = () => useContext(ProfileContext);
