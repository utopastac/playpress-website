"use stict";

const tinylr = require("tiny-lr");

const LIVE_RELOAD_PORT = 35729;
const lrserver = tinylr();

lrserver.listen(LIVE_RELOAD_PORT, (err) => {
  if (err) {
    console.log(
      `ERROR while trying to listen on port ${LIVE_RELOAD_PORT}`,
      err
    );
    return;
  }
  console.log(`Live Reload server started on port ${LIVE_RELOAD_PORT}`);
});
