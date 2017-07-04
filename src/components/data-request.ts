export type DataRequest = {
  offset: number;
  limit: number;
  resolve: (value?: any) => void;
};

export class Requester {
  dataRequests = [] as DataRequest[];

  add(offset: number, limit: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.dataRequests.push({ offset, limit, resolve });
    });
  }

  update(offset: number, limit: number) {
    this.dataRequests = this.dataRequests.filter(dr => {
      if (dr.offset === offset && dr.limit === limit) {
        dr.resolve();
        return false;
      }

      return true;
    });
  }
}
