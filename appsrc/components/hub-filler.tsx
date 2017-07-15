
import * as React from "react";

export class HubFiller extends React.Component<void> {
  render () {
    return <div className="hub-filler"/>;
  }

  shouldComponentUpdate () {
    return false;
  }
}

export default HubFiller;
