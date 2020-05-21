import { Profile } from "@itchio/valet/messages";
import { useContext, createContext } from "react";
import { Socket } from "renderer/Socket";

// n.b.: cheating the type system here, in practice the SocketContext always
// has a non-null socket, see index.tsx
export const SocketContext = createContext<Socket>(null as any);
export const OptionalProfileContext = createContext<Profile | undefined>(
  undefined
);
export const ProfileContext = createContext<Profile>(null as any);

export const useSocket = () => useContext(SocketContext);
export const useOptionalProfile = () => useContext(OptionalProfileContext);
export const useProfile = () => useContext(ProfileContext);
