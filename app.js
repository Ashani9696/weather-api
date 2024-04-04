const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const WeatherStation = require("./WeatherStation"); // Import your model

const swaggerDocument = YAML.load("./swagger.yaml"); // Load Swagger YAML file
const User = require("./User"); // Import your User model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticate = require("./authMiddleware");

const app = express();
const port = process.env.PORT || 5000;

mongoose.connect("mongodb://127.0.0.1:27017/weather");

app.use(cors());
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/weather/:district", authenticate, async (req, res) => {
  try {
    const { district } = req.params;
    const data = await WeatherStation.findOne({
      district: { $regex: new RegExp(`^${district}$`, "i") }, // Case-insensitive search
    }).sort({ timestamp: -1 });
    if (data) {
      res.json(data);
    } else {
      res.status(404).send("District not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/weather", authenticate, async (req, res) => {
  try {
    const data = await WeatherStation.find({}).sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/weather", authenticate, async (req, res) => {
  try {
    const newWeatherData = new WeatherStation(req.body);
    const savedData = await newWeatherData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// User Registration
app.post("/users/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// User Login
app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send("Unable to login");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Unable to login");
    }
    const token = jwt.sign({ _id: user._id.toString() }, "secret");
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Weather API listening at http://localhost:${port}`);
});
