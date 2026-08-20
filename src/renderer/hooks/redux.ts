import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, Dispatch } from "common/types";

export const useAppDispatch = () => useDispatch() as Dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
