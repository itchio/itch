import styled from "./styles";
import { Grid, GridProps } from "react-virtualized";

// listen, before you judge me for this code:
// sometimes typings go *way wrong*, okay?
// sometimes you just have no other choice but
// to pull stuff like this.
// it happens.
// it's okay.
// breathe.
// we'll be just fine, you and I.
// pinky swear.

const StyledGrid = (styled(Grid as any)`
  outline: none;
` as any) as React.ComponentClass<
  GridProps & { scrollPositionChangeReason: any }
>;
export default StyledGrid;
