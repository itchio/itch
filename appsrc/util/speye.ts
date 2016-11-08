
// tslint:disable:no-console

let self = function (msg: string) {
  return function (res: any) {
    console.log(`${msg}: ${JSON.stringify(res, null, 2)}`);
    return res;
  };
};

export default self;
