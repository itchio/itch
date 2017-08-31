export interface IRegisteredProtocols {
  [key: string]: boolean;
}

// put as a separate module to avoid reloading it
const registeredProtocols: IRegisteredProtocols = {};
export default registeredProtocols;
