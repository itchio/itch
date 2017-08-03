import * as React from "react";

import { throttle } from "underscore";

interface IDimensionsState {
  width: number;
  height: number;
  scrollTop: number;
}

export interface IDimensionsProps {
  width?: number;
  height?: number;
  scrollTop?: number;
  divRef?: (el: HTMLElement) => void;
}

declare class ResizeObserver {
  constructor(cb: () => void);
  observe(el: HTMLElement);
  disconnect();
}

export default function<P extends IDimensionsProps>(
  WrappedComponent: React.ComponentClass<P>,
): React.ComponentClass<P> {
  return class extends React.PureComponent<P, IDimensionsState> {
    ro: ResizeObserver;
    onScroll: any;

    constructor() {
      super();
      this.state = { width: 0, height: 0, scrollTop: 0 };
    }

    gotDivRef = (el: HTMLElement) => {
      if (!el) {
        return;
      }

      if (!this.ro) {
        this.ro = new ResizeObserver(() => {
          this.setState({
            width: el.clientWidth,
            height: el.clientHeight,
          });
        });
        this.ro.observe(el);
      }

      if (!this.onScroll) {
        this.onScroll = el.addEventListener(
          "scroll",
          throttle(
            () => {
              this.setState({
                scrollTop: el.scrollTop,
              });
            },
            45,
            { leading: false },
          ),
        );
      }
    };

    componentWillUnmount() {
      if (this.ro) {
        this.ro.disconnect();
        this.ro = null;
      }

      this.onScroll = null;
    }

    render() {
      const restProps = this.props;
      const { width, height, scrollTop } = this.state;

      return (
        <WrappedComponent
          width={width}
          height={height}
          scrollTop={scrollTop}
          divRef={this.gotDivRef}
          {...restProps}
        />
      );
    }
  };
}
