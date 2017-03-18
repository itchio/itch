
import * as React from "react";
import * as marked from "marked-extra";

interface IEmojifyReplaceCallback {
  (emoji: any, name: string): string;
}

interface IEmojify {
  replace(source: string, cb: IEmojifyReplaceCallback): string;
}

// emojify is generated but pure js, one reason the extrajs/ folder exists
const emojify = require("../util/emojify") as IEmojify;

import urls from "../constants/urls";

export class GFM extends React.Component<IGFMProps, void> {

  render () {
    return <div dangerouslySetInnerHTML={this.renderHTML()}/>;
  }

  renderHTML () {
    const {source} = this.props;

    const emojified = emojify.replace(source, (emoji, name) => `<span class='emoji emoji-${name}'></span>`);
    const autolinked = autolink(emojified);
    const sanitized = sanitize(autolinked);

    // TODO: handle invalid markdown gracefully
    const html = marked(sanitized);
    return {__html: html};
  }

}

interface IGFMProps {
  source: string;
}

const autolink = (src: string) => {
  return src.replace(/#([0-9]+)/g, (match, p1) => `[${match}](${urls.itchRepo}/issues/${p1})`);
};

const sanitize = (src: string) => {
  return src.replace(/\n##/g, "\n\n##");
};

export default GFM;
