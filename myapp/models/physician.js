let db = require("../db");
let User = require("./users").schema;

let physicianSchema = new db.Schema({
  email:          { type: String, required: true, unique: true },
  fullName:       { type: String, required: true },
  passwordHash:   String,
  dateRegistered: { type: Date, default: Date.now },
  lastAccess:     { type: Date, default: Date.now },
  patient:        [ User ]
});

let Physician = db.model("Physician", physicianSchema);

module.exports = Physician;
