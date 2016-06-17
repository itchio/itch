
import React, {Component, PropTypes} from 'react'

export default class LightImage extends Component {

  render () {
    const containerStyle = {
      position: 'relative',
      width: '100%',
      height: '100%'
    }

    const commonStyle = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '100%'
    }

    const imageStyle = {
      ...commonStyle
    }
    const canvasStyle = {
      ...commonStyle
    }

    return <div style={containerStyle} className='light-image'>
      <img onLoad={::this.onLoad} style={imageStyle} src={this.props.src}/>
      <canvas style={canvasStyle}/>
    </div>
  }

  onLoad () {
    console.log(`just loaded image ${this.props.src}`)
  }

}

LightImage.propTypes = {
  src: PropTypes.string.isRequired
}
