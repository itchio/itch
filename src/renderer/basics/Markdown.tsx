import urls from "common/constants/urls";
import marked from "marked-extra";
import React from "react";

// We used to import `emojify` from the `node-emoji` package to convert
// :shortcode: style emoji in markdown, but our locale files only use `:date:`.
// This minimal implementation only supports `:date:` - future translations
// should use emoji characters directly (e.g. 📅) instead of shortcodes.
const emojify = (text: string): string => {
  return text.replace(/:date:/g, "📅");
};

class Markdown extends React.PureComponent<Props> {
  render() {
    return <div dangerouslySetInnerHTML={this.renderHTML()} />;
  }

  renderHTML() {
    const { source } = this.props;

    const emojified = emojify(source);
    const autolinked = autolink(emojified);
    const sanitized = sanitize(autolinked);

    let html;
    try {
      html = marked(sanitized);
    } catch (e) {
      html = `Markdown error: ${e.error}`;
    }
    return { __html: html };
  }
}

export default Markdown;

interface Props {
  source: string;
}

const autolink = (src: string) => {
  return src.replace(
    /#([0-9]+)/g,
    (match, p1) => `[${match}](${urls.itchRepo}/issues/${p1})`
  );
};

const sanitize = (src: string) => {
  return src.replace(/\n##/g, "\n\n##");
};
