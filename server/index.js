require("dotenv").config();
const mongoose = require("mongoose");
const { createApp } = require("./app");
const { getConfig } = require("./config");

async function start() {
  const config = getConfig();
  await mongoose.connect(config.mongoUri);
  console.log("DB connected");

  const { app, apolloServer } = await createApp(config);
  const httpServer = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}${apolloServer.graphqlPath}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    httpServer.close(async () => {
      await apolloServer.stop();
      await mongoose.disconnect();
      process.exit(0);
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
