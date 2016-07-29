/* global Raven */

// this monkey-patches React so that the render method gracefully handles errors.
// it's evil on several levels, but you gotta do what you gotta do.
// source: https://gist.github.com/Aldredcz/4d63b0a9049b00f54439f8780be7f0d8

import React from 'react'
import env from '../env'

let errorPlaceholder = <noscript/>

if (env.name === 'development') {
  errorPlaceholder = (
    <span style={{
      background: 'red',
      color: 'white'
    }}>
    Render error!
    </span>
  )
}

function logError (Component, error) {
  const errorMsg = `Error while rendering component. Check render() method of component '${Component.displayName || Component.name || '[unidentified]'}'.`

  console.error(errorMsg, 'Error details:', error)

  if (typeof Raven !== 'undefined' && typeof Raven.captureException === 'function') {
    Raven.captureException(new Error(errorMsg), {
      extra: {
        errorStack: error.stack
      }
    })
  }
}

function monkeypatchRender (prototype) {
  if (prototype && prototype.render && !prototype.render.__handlingErrors) {
    const originalRender = prototype.render

    prototype.render = function monkeypatchedRender () {
      try {
        return originalRender.call(this)
      } catch (error) {
        logError(prototype.constructor, error)

        return errorPlaceholder
      }
    }

    prototype.render.__handlingErrors = true // flag render method so it's not wrapped multiple times
  } }

const originalCreateElement = React.createElement

React.createElement = (Component, ...rest) => {
  if (typeof Component === 'function') {
    if (typeof Component.prototype.render === 'function') {
      monkeypatchRender(Component.prototype)
    }

    // stateless functional component
    if (!Component.prototype.render) {
      const originalStatelessComponent = Component
      Component = (...args) => {
        try {
          return originalStatelessComponent(...args)
        } catch (error) {
          logError(originalStatelessComponent, error)

          return errorPlaceholder
        }
      }
    }
  }

  return originalCreateElement.call(React, Component, ...rest)
}

// allowing hot reload
const originalForceUpdate = React.Component.prototype.forceUpdate
React.Component.prototype.forceUpdate = function monkeypatchedForceUpdate () {
  monkeypatchRender(this)
  originalForceUpdate.call(this)
}
