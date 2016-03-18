
import React, {PropTypes, Component} from 'react'
import invariant from 'invariant'
import {connect} from './connect'

import ReactModal from 'react-modal'

import colors from '../constants/colors'

import {closeModal} from '../actions'
import {map} from 'underline'

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(7, 4, 4, 0.75)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0',
    backgroundColor: colors.darkMineShaft,
    border: `1px solid ${colors.lightMineShaft}`,
    borderRadius: '2px',
    boxShadow: '0 0 16px black'
  }
}

const DEFAULT_BUTTONS = {
  cancel: {
    label: 'Cancel',
    action: closeModal(),
    className: 'cancel'
  }
}

export class Modal extends Component {
  render () {
    const {modals = [], dispatch, closeModal} = this.props

    const modal = modals[0]

    if (modal) {
      const {buttons, title, message, detail} = modal

      return <ReactModal isOpen style={customStyles}>
        <div className='modal'>
          <div className='header'>
            <h2>{title}</h2>
            <div className='filler'/>
            <span className='icon icon-cross close-modal' onClick={closeModal}/>
          </div>

          <div className='body'>
            <div className='padder'/>
            <div className='message'>
              <p>{message}</p>
              {detail && <p className='secondary'>{detail}</p>}
            </div>
            <div className='padder'/>
          </div>

          <div className='buttons'>
            <div className='filler'/>
            {buttons::map((button, index) => {
              if (typeof button === 'string') {
                button = DEFAULT_BUTTONS[button]
                invariant(button, '')
              }
              const {label, action, className = '', icon} = button
              return <div className={`button ${className}`} key={index} onClick={() => dispatch(action)}>
                {icon ? <span className={`icon icon-${icon}`}/> : ''}
                {label}
              </div>
            })}
          </div>
        </div>
      </ReactModal>
    } else {
      return <div/>
    }
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
        label: PropTypes.string,
        action: PropTypes.object
      }),
      PropTypes.string // default buttons
    ])),
    title: PropTypes.string,
    message: PropTypes.string,
    detail: PropTypes.string
  })),

  closeModal: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  modals: state.modals
})

const mapDispatchToProps = (dispatch) => ({
  dispatch: (action) => {
    dispatch(action)
    dispatch(closeModal())
  },
  closeModal: () => dispatch(closeModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Modal)
