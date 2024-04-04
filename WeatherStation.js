const mongoose = require("mongoose");

const WeatherStationSchema = new mongoose.Schema({
  district: String,
  temperature: String,
  humidity: String,
  airPressure: String,
  latitude: { type: Number, required: true }, // Adding latitude as a required number
  longitude: { type: Number, required: true }, // Adding longitude as a required number
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WeatherStation", WeatherStationSchema);
