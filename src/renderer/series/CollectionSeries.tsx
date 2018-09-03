import { RequestCreator } from "butlerd";
import { Collection } from "common/butlerd/messages";
import React from "react";
import CollectionPreview from "renderer/pages/CollectionsPage/CollectionPreview";
import {
  makeSeries,
  BaseSeriesProps,
  FetchRes,
  RecordComponentProps,
} from "renderer/series/Series";
import { createStructuredSelector } from "reselect";

interface GenericExtraProps<Item> {}

interface CollectionSeriesProps<Params, Item>
  extends BaseSeriesProps<Params, Item, Collection>,
    GenericExtraProps<Item> {}

let fallbackGetKey = (c: Collection) => c.id;

export default function makeCollectionSeries<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Record = Collection;
  type Item = Res["items"][0];
  type ExtraProps = GenericExtraProps<Item>;
  const Series = makeSeries<Params, Res, Record, ExtraProps>(rc);
  type Props = CollectionSeriesProps<Params, Item>;

  class CollectionRecordComponent extends GenericCollectionRecordComponent<
    Item
  > {}

  class CollectionSeries extends React.PureComponent<Props> {
    selector: (props: Props) => GenericExtraProps<Item>;

    constructor(props: Props, context: any) {
      super(props, context);
      this.selector = createStructuredSelector({});
    }

    render() {
      const { props } = this;
      return (
        <Series
          {...props}
          fallbackGetKey={fallbackGetKey}
          RecordComponent={CollectionRecordComponent}
          extraProps={this.selector(props)}
        />
      );
    }

    static getRecordCallback(f: (item: Item) => Record) {
      return f;
    }

    static renderItemExtrasCallback(f: (item: Item) => JSX.Element) {
      return f;
    }
  }
  return CollectionSeries;
}

class GenericCollectionRecordComponent<Item> extends React.PureComponent<
  RecordComponentProps<Item, Collection, GenericExtraProps<Item>>
> {
  render() {
    const { item, record } = this.props;
    const coll = record;
    return <CollectionPreview coll={coll} />;
  }
}
