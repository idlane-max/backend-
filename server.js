require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API Backend is running ✅");
});

app.listen(5000, () => console.log("Server running on port 5000"));
