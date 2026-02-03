import React, { useEffect, useRef, useState } from "react";

interface Dimensions {
  width: number;
  height: number;
}

interface Props {
  children: (dims: Dimensions) => React.ReactNode;
}

/**
 * Measures parent container dimensions and passes them to children.
 * Uses ResizeObserver to track size changes.
 */
function ContainerDimensions({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return undefined;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(parent);

    // Get initial dimensions
    const rect = parent.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, []);

  if (!dimensions) {
    return <div ref={ref} />;
  }

  return <>{children(dimensions)}</>;
}

export default ContainerDimensions;
