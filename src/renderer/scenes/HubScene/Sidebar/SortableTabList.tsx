import React, { useEffect, useLayoutEffect, useRef } from "react";
import styled from "renderer/styles";
import Tab from "renderer/scenes/HubScene/Sidebar/Tab";

const Container = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
`;

const ACTIVATION_DISTANCE = 5;
const ROW_TRANSITION = "transform 300ms cubic-bezier(0.2, 0, 0, 1)";
const EDGE_ZONE = 32;
const MAX_SCROLL_SPEED = 14;

interface Drag {
  pointerId: number;
  /** index of the row being dragged */
  index: number;
  /** index the row would land on if released now */
  target: number;
  startClientX: number;
  startClientY: number;
  lastClientY: number;
  startScrollTop: number;
  /** false until the pointer moves past ACTIVATION_DISTANCE */
  dragging: boolean;
  /** row tops in container content coordinates, measured at pointerdown */
  tops: number[];
  /** distance between consecutive row tops (row height + collapsed margin) */
  pitch: number;
  raf: number;
}

interface Props {
  items: string[];
  currentTab: string;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
}

export default function SortableTabList({
  items,
  currentTab,
  onSortEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);

  const rowElements = (): HTMLElement[] => {
    const c = containerRef.current;
    return c ? (Array.from(c.children) as HTMLElement[]) : [];
  };

  const clearRowStyles = () => {
    for (const el of rowElements()) {
      el.style.transform = "";
      el.style.transition = "";
      el.style.zIndex = "";
      el.style.position = "";
    }
  };

  const abortDrag = () => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    cancelAnimationFrame(drag.raf);
    dragRef.current = null;
    clearRowStyles();
  };

  // a tab opening or closing mid-drag invalidates every measurement
  const itemsKey = items.join("\n");
  useLayoutEffect(() => {
    abortDrag();
  }, [itemsKey]);
  useEffect(() => abortDrag, []);

  const updateDrag = (drag: Drag) => {
    const c = containerRef.current;
    if (!c || !drag.dragging) {
      return;
    }
    const all = rowElements();
    const n = all.length;
    const startTop = drag.tops[drag.index];
    const raw =
      drag.lastClientY -
      drag.startClientY +
      (c.scrollTop - drag.startScrollTop);
    const dy = Math.max(
      drag.tops[0] - startTop,
      Math.min(drag.tops[n - 1] - startTop, raw)
    );
    const target = Math.max(
      0,
      Math.min(n - 1, drag.index + Math.round(dy / drag.pitch))
    );
    drag.target = target;

    all.forEach((el, i) => {
      if (i === drag.index) {
        el.style.transform = `translate3d(0, ${dy}px, 0)`;
        return;
      }
      let shift = 0;
      if (i > drag.index && i <= target) {
        shift = -drag.pitch;
      } else if (i < drag.index && i >= target) {
        shift = drag.pitch;
      }
      el.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
    });
  };

  const autoScroll = (drag: Drag) => {
    const c = containerRef.current;
    if (!c || !drag.dragging) {
      return;
    }
    const rect = c.getBoundingClientRect();
    let speed = 0;
    if (drag.lastClientY < rect.top + EDGE_ZONE) {
      const overlap = rect.top + EDGE_ZONE - drag.lastClientY;
      speed = -MAX_SCROLL_SPEED * Math.min(1, overlap / EDGE_ZONE);
    } else if (drag.lastClientY > rect.bottom - EDGE_ZONE) {
      const overlap = drag.lastClientY - (rect.bottom - EDGE_ZONE);
      speed = MAX_SCROLL_SPEED * Math.min(1, overlap / EDGE_ZONE);
    }
    if (speed !== 0) {
      const before = c.scrollTop;
      c.scrollTop = before + speed;
      if (c.scrollTop !== before) {
        updateDrag(drag);
      }
    }
  };

  const startDrag = (drag: Drag) => {
    const c = containerRef.current;
    if (!c) {
      return;
    }
    drag.dragging = true;
    // capture only once dragging: capturing on every press would retarget
    // clicks away from the tab buttons
    c.setPointerCapture(drag.pointerId);
    rowElements().forEach((el, i) => {
      if (i === drag.index) {
        el.style.position = "relative";
        el.style.zIndex = "100";
      } else {
        el.style.transition = ROW_TRANSITION;
      }
    });
    const loop = () => {
      autoScroll(drag);
      drag.raf = requestAnimationFrame(loop);
    };
    drag.raf = requestAnimationFrame(loop);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    suppressClickRef.current = false;
    if (e.button !== 0 || dragRef.current) {
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest(".tab-close-button")) {
      return;
    }
    const c = containerRef.current;
    const all = rowElements();
    const row = target.closest("[data-sortable-row]");
    const index = row ? all.indexOf(row as HTMLElement) : -1;
    if (!c || index < 0) {
      return;
    }

    const crect = c.getBoundingClientRect();
    const tops = all.map(
      (el) => el.getBoundingClientRect().top - crect.top + c.scrollTop
    );
    dragRef.current = {
      pointerId: e.pointerId,
      index,
      target: index,
      startClientX: e.clientX,
      startClientY: e.clientY,
      lastClientY: e.clientY,
      startScrollTop: c.scrollTop,
      dragging: false,
      tops,
      pitch: all.length > 1 ? tops[1] - tops[0] : all[index].offsetHeight,
      raf: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) {
      return;
    }
    if ((e.buttons & 1) === 0) {
      // the left button is up but we never got a pointerup: something
      // (like a native context menu) swallowed the release
      abortDrag();
      return;
    }
    drag.lastClientY = e.clientY;
    if (!drag.dragging) {
      const dist = Math.hypot(
        e.clientX - drag.startClientX,
        e.clientY - drag.startClientY
      );
      if (dist < ACTIVATION_DISTANCE) {
        return;
      }
      startDrag(drag);
    }
    updateDrag(drag);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) {
      return;
    }
    if (!drag.dragging) {
      dragRef.current = null;
      return;
    }
    suppressClickRef.current = true;
    cancelAnimationFrame(drag.raf);
    dragRef.current = null;
    // styles must clear in the same paint as the reorder; React flushes
    // discrete input event updates before the browser paints, on both
    // legacy and createRoot roots
    clearRowStyles();
    onSortEnd(drag.index, drag.target);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      abortDrag();
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // no context menus mid-drag: the native menu steals input, so the
  // pointerup would never reach us
  const onContextMenuCapture = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag && drag.dragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Container
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
      onClickCapture={onClickCapture}
      onContextMenuCapture={onContextMenuCapture}
    >
      {items.map((tab) => (
        <div key={tab} data-sortable-row>
          <Tab tab={tab} active={currentTab === tab} sortable />
        </div>
      ))}
    </Container>
  );
}
