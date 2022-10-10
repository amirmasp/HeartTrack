var db = require("../db");

// Define the schema
var argonDataSchema = new db.Schema({
  deviceId:   String,
  satOxygen: Number,
  avgBPM:     Number,
  takenTime: { type: Date, default: Date.now }
});


var ArgonData = db.model("ArgonData", argonDataSchema);

module.exports = ArgonData;
