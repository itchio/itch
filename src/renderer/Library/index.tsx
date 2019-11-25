import React, { useContext, useState, useEffect } from "react";
import { SocketContext } from "renderer/Route";
import { messages } from "common/butlerd";

export const App = () => {
  const socket = useContext(SocketContext);
  const [version, setVersion] = useState("??");

  useEffect(() => {
    if (!socket) {
      return;
    }

    console.log("Got socket, oh yes");
    (async () => {
      const res = await socket.call(messages.VersionGet, {});
      console.log("res = ", res);
      setVersion(res.versionString);
    })();
  }, [socket]);

  return <div>I'm the library! We're using butler {version}</div>;
};
