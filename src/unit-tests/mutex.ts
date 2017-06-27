/*
 * returns a mutex-locked version of async function `fn`, which is assumed to
 * return a promies.
 */

// stolen from https://github.com/rstacruz/tape-watch/blob/master/lib/mutex.js

export default function mutex(fn) {
  let running = false;
  return async function(...args: any[]) {
    if (running) {
      return;
    }
    running = true;
    const onUncaught = function(e) {
      console.log("uncaught exception: ", e);
      running = false;
    };
    process.on("uncaughtException", onUncaught);

    try {
      return await fn(...args);
    } finally {
      process.removeListener("uncaughtException", onUncaught);
      running = false;
    }
  };
}
