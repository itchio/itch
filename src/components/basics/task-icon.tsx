
import * as React from "react";

import Icon from "./icon";

import taskToIcon from "../../constants/icon-for-tasks";

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends React.Component<ITaskIconProps, void> {
  render () {
    const {task = "", action = "launch", animate = false} = this.props;

    let icon = taskToIcon[task] || "";
    if (task === "idle") {
      if (action === "open") {
        icon = "folder-open";
      } else {
        icon = "rocket";
      }
    }

    const classes = animate ? ["scan"] : [];    
    return <Icon icon={icon} classes={classes}/>;
  }
}

interface ITaskIconProps {
  task: string;
  action?: string;
  animate?: boolean;
}

export default TaskIcon;
