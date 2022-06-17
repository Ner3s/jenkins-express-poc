const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APPLICATION_NAME || "Express App";

const packageJson = require("./package.json");

app.use(express.json());

app.get("/", (req, res, next) => {
  res.send({ "Hello World": "Olá Mundo", version: packageJson.version });
});

app.listen(`${PORT}`, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Server run in BRANCH MAIN`);
  console.log(`APLICATION NAME = ${APP_NAME}`);
});
