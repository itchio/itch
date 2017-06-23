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
    process.on("uncaughtException", function(e) {
      console.log("uncaught exception: ", e);
      running = false;
    });

    try {
      return await fn(...args);
    } finally {
      running = false;
    }
  };
}
