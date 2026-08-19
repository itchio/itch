import React, { useEffect, useMemo, useState } from "react";
import styled, * as styles from "renderer/styles";

function isComposite(value: any): boolean {
  const type = Object.prototype.toString.call(value);
  return type === "[object Object]" || type === "[object Array]";
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().indexOf(query) !== -1;
}

const NOT_FOUND = Symbol("not-found");

// Prune to entries whose key or primitive value contains the query.
// A composite whose own key matches is kept whole.
function filterComposite(data: any, query: string): any {
  const result: any = {};
  let found = false;
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (matches(key, query)) {
      result[key] = value;
      found = true;
    } else if (isComposite(value)) {
      const sub = filterComposite(value, query);
      if (sub !== NOT_FOUND) {
        result[key] = sub;
        found = true;
      }
    } else if (matches(String(value), query)) {
      result[key] = value;
      found = true;
    }
  }
  return found ? result : NOT_FOUND;
}

function valueType(value: any): string {
  if (value === null) {
    return "null";
  }
  return typeof value;
}

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) {
    return <>{text}</>;
  }
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx: number;
  while ((idx = lower.indexOf(query, i)) !== -1) {
    if (idx > i) {
      parts.push(text.slice(i, idx));
    }
    parts.push(<Mark key={idx}>{text.slice(idx, idx + query.length)}</Mark>);
    i = idx + query.length;
  }
  parts.push(text.slice(i));
  return <>{parts}</>;
};

interface LeafProps {
  name: string;
  value: any;
  originalValue: any;
  root?: boolean;
  query: string;
}

const Leaf = ({ name, value, originalValue, root, query }: LeafProps) => {
  const [expanded, setExpanded] = useState(!!root);
  const [showOriginal, setShowOriginal] = useState(false);
  const displayedValue = showOriginal ? originalValue : value;
  const composite = isComposite(displayedValue);
  const pruned = query && isComposite(value) && value !== originalValue;

  // While searching, expand along the pruned tree so results are visible,
  // except where the key itself matched: its subtree is unfiltered and
  // could be huge.
  useEffect(() => {
    if (query) {
      setExpanded(!matches(name, query));
    } else {
      setExpanded(!!root);
    }
  }, [query, name, root]);

  useEffect(() => {
    setShowOriginal(false);
  }, [query, value, originalValue]);

  let title: React.ReactNode;
  if (composite) {
    const count = Object.keys(displayedValue).length;
    title = (
      <HelperValue>
        {Array.isArray(displayedValue) ? "[]" : "{}"} {count}{" "}
        {count === 1 ? "item" : "items"}
      </HelperValue>
    );
  } else {
    title = (
      <LeafValue data-type={valueType(displayedValue)}>
        <Highlight text={String(displayedValue)} query={query} />
      </LeafValue>
    );
  }

  return (
    <LeafDiv>
      <Line
        onClick={composite ? () => setExpanded(!expanded) : undefined}
        className={composite ? "composite" : undefined}
      >
        {composite ? <Arrow>{expanded ? "▾" : "▸"}</Arrow> : null}
        <Key>
          <Highlight text={name} query={query} />:
        </Key>
        {title}
        {pruned && !showOriginal ? (
          <ShowOriginal
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowOriginal(true);
            }}
          >
            ⥂ expand
          </ShowOriginal>
        ) : null}
      </Line>
      {composite && expanded ? (
        <Children>
          {Object.keys(displayedValue).map((key) => (
            <Leaf
              key={key}
              name={key}
              value={displayedValue[key]}
              originalValue={originalValue[key]}
              query={query}
            />
          ))}
        </Children>
      ) : null}
    </LeafDiv>
  );
};

const JsonInspector = ({ data }: { data: any }) => {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(input.length >= 2 ? input.toLowerCase() : "");
    }, 150);
    return () => clearTimeout(id);
  }, [input]);

  const shown = useMemo(() => {
    if (!query) {
      return data;
    }
    if (!isComposite(data)) {
      return matches(String(data), query) ? data : NOT_FOUND;
    }
    return filterComposite(data, query);
  }, [data, query]);

  return (
    <InspectorDiv>
      <SearchInput
        type="search"
        placeholder="Search"
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
      />
      {shown === NOT_FOUND ? (
        <NotFound>Nothing found</NotFound>
      ) : (
        <Leaf
          name="root"
          value={shown}
          originalValue={data}
          root
          query={query}
        />
      )}
    </InspectorDiv>
  );
};

const InspectorDiv = styled.div`
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
`;

const SearchInput = styled.input`
  ${styles.heavyInput};
  min-width: 300px;
  margin: 0 0 10px 0;
`;

const LeafDiv = styled.div``;

const Line = styled.div`
  display: flex;
  align-items: baseline;
  padding: 1px 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.composite {
    cursor: pointer;
  }
`;

const Arrow = styled.span`
  color: ${(props) => props.theme.ternaryText};
  margin-right: 4px;
  user-select: none;
`;

const Key = styled.span`
  color: ${(props) => props.theme.secondaryText};
  margin-right: 5px;
  white-space: nowrap;
`;

const LeafValue = styled.span`
  word-break: break-all;
  white-space: pre-wrap;

  &[data-type="string"] {
    color: ${(props) => props.theme.success};
  }

  &[data-type="number"] {
    color: ${(props) => props.theme.baseColors.amber};
  }

  &[data-type="boolean"] {
    color: ${(props) => props.theme.buy};
  }

  &[data-type="null"],
  &[data-type="undefined"] {
    color: ${(props) => props.theme.ternaryText};
  }
`;

const HelperValue = styled.span`
  color: ${(props) => props.theme.ternaryText};
`;

const ShowOriginal = styled.button`
  appearance: none;
  border: 0;
  background: none;
  color: ${(props) => props.theme.ternaryText};
  cursor: pointer;
  font: inherit;
  margin-left: 6px;
  padding: 0;

  &:hover {
    color: ${(props) => props.theme.secondaryText};
  }
`;

const Children = styled.div`
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  margin-left: 4px;
`;

const NotFound = styled.div`
  color: ${(props) => props.theme.ternaryText};
  padding: 10px 0;
`;

const Mark = styled.span`
  background: ${(props) => props.theme.baseColors.amber};
  color: ${(props) => props.theme.baseColors.codGray};
  border-radius: 2px;
`;

export default JsonInspector;
