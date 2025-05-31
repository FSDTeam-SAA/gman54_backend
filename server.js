require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
var cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");


app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

let server = app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);

mongoose
  .connect(`${process.env.MONGO_DB_URL}`)
  .then(async () => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

});

const globalErrorHandler = require("./middleware/globalErrorHandler");
const notFound = require("./middleware/notFound");


app.use(globalErrorHandler);
app.use(notFound);

app.get("/", (req, res) => {
  res.send("server is running...!!");
});