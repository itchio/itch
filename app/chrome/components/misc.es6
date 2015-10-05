
import React from "react";

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
export class Icon extends React.Component {
  render() {
    let {icon} = this.props;

    if (icon) {
      return <span className={`icon icon-${icon}`}/>
    } else {
      return <span/>;
    }
  }
}

/**
 * A single progress bar, with an outer and inner div. Style as you wish.
 */
export class ProgressBar extends React.Component {
  render() {
    let {progress} = this.props;
    if (!progress) return <div/>;

    let style = {
      width: `${progress * 100}%`
    }

    return <div className="progress_outer">
      <div className="progress_inner" style={style}/>
    </div>
  }
}

/**
 * A bunch of errors displayed in a list
 */
export class ErrorList extends React.Component {
  render() {
    let {errors} = this.props;

    if (!errors) {
      return <div/>;
    }

    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    return <ul className="form_errors">
      {errors.map((error, key) => {
        return <li key={key}>{error}</li>
      })}
    </ul>;
  }
}

