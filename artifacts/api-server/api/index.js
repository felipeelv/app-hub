const app = require("../dist/app.cjs");

module.exports = async function handler(req, res) {
  return (app.default || app)(req, res);
};
