
import * as React from "react";
import * as marked from "marked-extra";

// emojify is generated but pure js, one reason the extrajs/ folder exists
import * as emojify from "../../format/emojify";

import urls from "../../constants/urls";

export default class Markdown extends React.PureComponent<IGFMProps, void> {

  render () {
    return <div dangerouslySetInnerHTML={this.renderHTML()}/>;
  }

  renderHTML () {
    const {source} = this.props;

    const emojified = emojify.replace(
      source,
      (emoji, name) => `<span class='emoji emoji-${name}'></span>`,
    );
    const autolinked = autolink(emojified);
    const sanitized = sanitize(autolinked);

    let html;
    try {
      html = marked(sanitized);
    } catch (e) {
      html = `Markdown error: ${e.error}`;
    }
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
