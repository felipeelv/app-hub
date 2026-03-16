import app from "./app";
import { autoSeedIfEmpty } from "./seed";

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);

// Vercel serverless handler
if (process.env.VERCEL) {
  // Running on Vercel - export handler
  module.exports = app;
} else {
  // Running locally - start server
  autoSeedIfEmpty()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("Failed to auto-seed database:", err);
      app.listen(port, () => {
        console.log(`Server listening on port ${port} (seed skipped due to error)`);
      });
    });
}

export default app;
