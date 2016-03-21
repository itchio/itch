
import React, {PropTypes, Component} from 'react'
import marked from 'marked-extra'
import emojify from '../util/emojify'

import urls from '../constants/urls'

export class GFM extends Component {

  render () {
    return <div dangerouslySetInnerHTML={this.renderHTML()}/>
  }

  renderHTML () {
    const {source} = this.props

    const emojified = emojify.replace(source, (emoji, name) => `<span class='emoji emoji-${name}'></span>`)
    const autolinked = autolink(emojified)
    const sanitized = sanitize(autolinked)

    // TODO: handle invalid markdown gracefully
    const __html = marked(sanitized)
    return {__html}
  }

}

const autolink = (src) => src.replace(/#([0-9]+)/g, (match, p1) => `[${match}](${urls.itchRepo}/issues/${p1})`)
const sanitize = (src) => src.replace(/\n##/g, '\n\n##')

GFM.propTypes = {
  source: PropTypes.string.isRequired
}

export default GFM
