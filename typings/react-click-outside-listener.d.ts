declare module "react-click-outside-listener" {
  export function useOutsideClickListener(
    cb: () => void
  ): React.Ref | ((n: number) => React.Ref);
}
