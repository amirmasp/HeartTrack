
const mongoose = require("mongoose");


// Use this on AWS ec2 with locally installed MongoDB
mongoose.connect("mongodb://localhost/ECE513FinalProject", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });


module.exports = mongoose;
