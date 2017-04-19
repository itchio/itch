
import * as React from "react";
import {Circle} from "rc-progress";

export default class LoadingCircle extends React.Component<ILoadingCircleProps, void> {
    render () {
        const {progress} = this.props;

        return <div className="circle-container">
            <Circle
                percent={progress > 0 ? progress * 100.0 : 0}
                trailWidth="3" trailColor="#e0e0e2"
                strokeWidth="15" strokeColor="white"/>
        </div>;
    }
}

export interface ILoadingCircleProps {
    progress: number;
}
