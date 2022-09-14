const fs = require("fs");
const { io } = require("socket.io-client");

const endpoint = "https://stt-2.parami.ai";
const apiToken = process.argv[2];
const audioFile = "demo_short.wav";

const asyncEmit = async (socket, endpoint, data) => {
  return new Promise((resolve) => {
    socket.emit(endpoint, data, resolve);
  });
};

const sleep = async (timeMs) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

const main = async () => {
  const socket = io(endpoint, {
    transports: ["websocket"],
    secure: true,
    rejectUnauthorized: false,
  });
  await new Promise((resolve) => {
    socket.on("connect", () => {
      console.log("connected");
      resolve();
    });
    socket.on("disconnect", () => {
      console.log("disconnected");
    });
    socket.on("speechData", (data) => {
      console.log("data >>", JSON.stringify(data));
    });

    socket.on("connect_error", (err) => {
      console.log("error", err);
    });
  });

  console.log("authenticate");
  await asyncEmit(socket, "authenticate", apiToken);

  console.log("startStream");
  await asyncEmit(socket, "startStream", {});

  console.log("sending binary data");
  const dataBytes = fs.readFileSync(audioFile);
  await asyncEmit(socket, "binaryData", dataBytes);

  console.log("sending empty binary data");
  for (let index = 0; index < 100; index++) {
    await asyncEmit(socket, "binaryData", Buffer.from("\x00"));
    await sleep(4);
  }

  console.log("endStream");
  await asyncEmit(socket, "endStream", "");

  console.log("sleep");
  await sleep(10000);
};

main()
  .then(() => {})
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    process.exit();
  });
