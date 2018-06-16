interface RegisteredProtocols {
  [key: string]: boolean;
}

// put as a separate module to avoid reloading it
const registeredProtocols: RegisteredProtocols = {};
export default registeredProtocols;
