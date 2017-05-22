
export default function (msBetweenRequests: number) {
  if (msBetweenRequests <= 0) {
    throw new Error("cooldown must have strictly positive msBetweenRequests");
  }
  let lastRequest = 0;

  return function cooldown (): Promise<void> {
    const now = Date.now();
    const nextAcceptable = lastRequest + msBetweenRequests;
    const quiet = nextAcceptable - now;

    if (now > nextAcceptable) {
      lastRequest = now;
      return Promise.resolve();
    } else {
      lastRequest = nextAcceptable;
    }

    return new Promise<void>((resolve: () => void, reject: () => void) => {
      setTimeout(resolve, quiet);
    });
  };
};
