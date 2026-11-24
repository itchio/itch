# Renderer component conventions

New components are function components with hooks. Class components and
the HOCs in `renderer/hocs` are legacy, convert a file when you're in it.

`pages/PreferencesPage`, `pages/GamePage.tsx` and
`modal-widgets/ConfirmQuit.tsx` are good examples to copy.

## Shape of a component

```tsx
interface Props {
  name: string;
}

const Thing = ({ name }: Props) => {
  const dispatch = useAppDispatch();
  const pkg = useAppSelector((rs) => rs.broth.packages[name]);
  const [expanded, setExpanded] = useState(false);

  const onClick = () => setExpanded((expanded) => !expanded);

  return <button onClick={onClick}>{pkg.version}</button>;
};

export default Thing;
```

- Arrow function, `Props` interface above it, default export at the bottom.
- Constants and pure helpers go at module scope, not inside the component.
- A `renderFoo()` method on a class becomes a small component in the same file.
- Handlers are plain functions. Reach for `useCallback`/`useMemo` only when
  something downstream depends on the identity.
- `React.memo` replaces `PureComponent` only where it matters: rows in a
  list, or a component with an expensive subtree.

## What replaces what

| Legacy                        | Hook                                               |
| ----------------------------- | -------------------------------------------------- |
| `hook()` / `hookWithProps()`  | `useAppSelector`, `useAppDispatch` (`hooks/redux`) |
| `withTab`                     | `useTab()`                                         |
| `withProfile`                 | `useProfile()`                                     |
| `injectIntl`                  | `useIntl()` from react-intl                        |
| `watchStore` in mount/unmount | `useWatcher()`                                     |

## Store

- One `useAppSelector` per value. Select the smallest thing you need, not a
  whole slice like `rs.system`.
- A selector must return the same reference for the same state. Don't build
  objects or arrays in it, and watch out for `NaN`.
- Tab state: `useAppSelector((rs) => ambientTab(rs, { tab }).location)`.
- Tab actions use the helpers in `hocs/tab-utils`:
  `dispatchTabPageUpdate({ tab, dispatch }, { label })`.

## butlerd

```tsx
const { loading, error, result } = useButlerd(messages.FetchGame, { gameId });
```

- `result` is undefined until the first fetch succeeds, and keeps the last
  good value while refetching. That includes after params change, so give
  the component a `key` if showing the previous result would be wrong.
- The component decides what loading and errors look like. For the plain
  case use `basics/LoadingState` and `basics/ErrorState`:
  `if (loading) return <LoadingState />`.
- Pass a page's `sequence` to refetch fresh on reload.
- `onResult` is for side effects like setting the tab label.
- Hooks can't be called conditionally. When a param might be missing, check
  it in the parent and render a child that takes it as a required prop
  (see `GamePage`).
