
import React, {PropTypes, Component} from 'react'
import invariant from 'invariant'
import {connect} from './connect'

import ReactModal from 'react-modal'
import GFM from './gfm'

import colors from '../constants/colors'

import {closeModal} from '../actions'
import {map, each} from 'underline'

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(7, 4, 4, 0.75)'
  },
  content: {
    top: '50%',
    left: '50%',
    minWidth: '50%',
    maxWidth: '70%',
    maxHeight: '80%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0px',
    backgroundColor: colors.darkMineShaft,
    border: `1px solid ${colors.lightMineShaft}`,
    borderRadius: '2px',
    boxShadow: '0 0 16px black',
    zIndex: 400
  }
}

const DEFAULT_BUTTONS = {
  cancel: {
    label: ['prompt.action.cancel'],
    action: closeModal(),
    className: 'secondary'
  }
}

export class Modal extends Component {
  render () {
    const {t, modals = [], closeModal} = this.props

    const modal = modals[0]

    if (modal) {
      const {bigButtons = [], buttons = [], cover, title, message, detail} = modal

      return <ReactModal isOpen style={customStyles}>
        <div className='modal'>
          <div className='header'>
            <h2>{t.format(title)}</h2>
            <div className='filler'/>
            <span className='icon icon-cross close-modal' onClick={closeModal}/>
          </div>

          <div className='body'>
            <div className='message'>
              <div><GFM source={t.format(message)}/></div>
              {detail && <div className='secondary'><GFM source={t.format(detail)}/></div>}
            </div>
          </div>

          {bigButtons.length > 0
          ? <div className='big-wrapper'>
            {cover
              ? <img className='cover' src={cover}/>
              : ''}
            {this.renderButtons(bigButtons, 'big')}
          </div>
          : ''}

          {this.renderButtons(buttons, 'normal')}
        </div>
      </ReactModal>
    } else {
      return <div/>
    }
  }

  renderButtons (buttons, flavor) {
    if (buttons.length === 0) return ''

    const {t, dispatch} = this.props

    return <div className={`buttons flavor-${flavor}`}>
      <div className='filler'/>
      {buttons::map((button, index) => {
        if (typeof button === 'string') {
          button = DEFAULT_BUTTONS[button]
          invariant(button, '')
        }
        const {label, action, className = '', icon} = button
        const onClick = () => dispatch(action)

        return <div className={`button ${className}`} key={index} onClick={onClick}>
        {icon ? <span className={`icon icon-${icon}`}/> : ''}
        {t.format(label)}
        </div>
      })}
    </div>
  }

  typeToIcon (type) {
    let icon = 'neutral'
    if (type === 'question') {
      icon = 'hand'
    } else if (type === 'warning') {
      icon = 'warning'
    } if (type === 'error') {
      icon = 'error'
    }

    return <span className={`icon icon-${icon}`}/>
  }

  componentWillMount () {
    ReactModal.setAppElement('body')
  }
}

Modal.propTypes = {
  modals: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['question']),
    buttons: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.shape({ // custom buttons
        label: PropTypes.string.isRequired,
        action: PropTypes.object,
        icon: PropTypes.string
      }),
      PropTypes.string // default buttons
    ])),
    title: PropTypes.string,
    message: PropTypes.string,
    detail: PropTypes.string
  })),

  t: PropTypes.func.isRequired,

  closeModal: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  modals: state.modals
})

const mapDispatchToProps = (dispatch) => ({
  dispatch: (action) => {
    if (action) {
      if (Array.isArray(action)) {
        action::each((a) => dispatch(a))
      } else {
        dispatch(action)
      }
    }
    dispatch(closeModal())
  },
  closeModal: () => dispatch(closeModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Modal)
