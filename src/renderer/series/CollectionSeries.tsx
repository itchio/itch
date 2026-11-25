import { RequestCreator } from "@itchio/butlerd";
import { Collection } from "common/butlerd/messages";
import React from "react";
import CollectionPreview from "renderer/pages/CollectionsPage/CollectionPreview";
import {
  BaseSeriesProps,
  FetchRes,
  makeSeries,
  RecordComponentProps,
} from "renderer/series/Series";

interface ExtraProps {}

const emptyExtraProps: ExtraProps = {};

const fallbackGetKey = (c: Collection) => c.id;

const CollectionRecord = React.memo(
  ({ record }: RecordComponentProps<unknown, Collection, ExtraProps>) => (
    <CollectionPreview coll={record} />
  )
);

export default function makeCollectionSeries<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Record = Collection;
  type Item = Res["items"][0];
  const Series = makeSeries<Params, Res, Record, ExtraProps>(rc);
  type Props = BaseSeriesProps<Params, Item, Record>;

  const CollectionSeries = (props: Props) => (
    <Series
      {...props}
      fallbackGetKey={fallbackGetKey}
      RecordComponent={CollectionRecord}
      extraProps={emptyExtraProps}
    />
  );

  // identity helpers, see GameSeries
  return Object.assign(CollectionSeries, {
    getRecordCallback: (f: (item: Item) => Record) => f,
    renderItemExtrasCallback: (f: (item: Item) => JSX.Element) => f,
  });
}
