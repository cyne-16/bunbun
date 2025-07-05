// server.js
const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();

const PORT = 3000;

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
