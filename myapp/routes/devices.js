const express = require('express');
let router = express.Router();
let jwt = require("jwt-simple");
let fs = require('fs');
let superagent = require('superagent');
let Device = require("../models/device");


// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();
let particleAccessToken = fs.readFileSync(__dirname + '/../../particleAccessToken').toString();

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
  let newApikey = "";
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 32; i++) {
    newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return newApikey;
}

router.post('/register', function(req, res, next) {
  let responseJson = {
    registered: false,
    message : "",
    apikey : "none",
    deviceId : "none"
  };
  let deviceExists = false;
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }

  let email = "";
    
  // If authToken provided, use email in authToken 
  if (req.headers["x-auth"]) {
    try {
      let decodedToken = jwt.decode(req.headers["x-auth"], secret);
      email = decodedToken.email;
    }
    catch (ex) {
      responseJson.message = "Invalid authorization token.";
      return res.status(401).json(responseJson);
    }
  }
  else {
    // Ensure the request includes the email parameter
    if( !req.body.hasOwnProperty("email")) {
      responseJson.message = "Invalid authorization token or missing email address.";
      return res.status(401).json(responseJson);
    }
    email = req.body.email;
  }
    
  // See if device is already registered
  Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
    if (device !== null) {
      responseJson.message = "Device ID " + req.body.deviceId + " already registered.";
      return res.status(400).json(responseJson);
    }
    else {
      // Get a new apikey
	   deviceApikey = getNewApikey();
      
     if(req.body.deviceId == ""){
      responseJson.message = "Device ID cannot be empty.";
      return res.status(400).json(responseJson);
     }
	    // Create a new device with specified id, user email, and randomly generated apikey.
      let newDevice = new Device({
        deviceId: req.body.deviceId,
        userEmail: email,
        apikey: deviceApikey
      });

      // Save device. If successful, return success. If not, return error message.
      newDevice.save(function(err, newDevice) {
        if (err) {
          responseJson.message = err;
          // This following is equivalent to: res.status(400).send(JSON.stringify(responseJson));
          return res.status(400).json(responseJson);
        }
        else {
          responseJson.registered = true;
          responseJson.apikey = deviceApikey;
          responseJson.deviceId = req.body.deviceId;
          responseJson.message = "Device ID " + req.body.deviceId + " was registered.";
          return res.status(201).json(responseJson);
        }
      });
      
    }
  });
});

router.post('/ping', function(req, res, next) {
    let responseJson = {
        success: false,
        message : "",
    };
    let deviceExists = false;
    
    // Ensure the request includes the deviceId parameter
    if( !req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Missing deviceId.";
        return res.status(400).json(responseJson);
    }
    
    // If authToken provided, use email in authToken 
    try {
        let decodedToken = jwt.decode(req.headers["x-auth"], secret);
    }
    catch (ex) {
        responseJson.message = "Invalid authorization token.";
        return res.status(400).json(responseJson);
    }
    
    request({
       method: "POST",
       uri: "https://api.particle.io/v1/devices/" + req.body.deviceId + "/pingDevice",
       form: {
	       access_token : particleAccessToken,
	       args: "" + (Math.floor(Math.random() * 11) + 1)
        }
    });
            
    responseJson.success = true;
    responseJson.message = "Device ID " + req.body.deviceId + " pinged.";
    return res.status(200).json(responseJson);
});

router.post('/updateFreq', function(req, res, next) {
  let responseJson = {
      success: false,
      message : "",
  };
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
      responseJson.message = "Missing deviceId.";
      return res.status(400).json(responseJson);
  }

  if( !req.body.hasOwnProperty("newFrequency")) {
    responseJson.message = "Missing Frequency.";
    return res.status(400).json(responseJson);
  }
  
  else{
    superagent
      .post("https://api.particle.io/v1/devices/" + req.body.deviceId + "/updateFrequency")
      .type('application/x-www-form-urlencoded')
      .send({ args: req.body.newFrequency, access_token : particleAccessToken }) 
      .end((err, response) => {
        // console.log(response.body.return_value); //debug check particle return value
        responseJson.success = true;
        responseJson.message = "Device ID " + req.body.deviceId + " changed Frequency of Measurement.";
        return res.status(200).json(responseJson);
      });
  }
        
});

router.post('/updateStartTime', function(req, res, next) {
  let responseJson = {
      success: false,
      message : "",
  };
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
      responseJson.message = "Missing deviceId.";
      return res.status(400).json(responseJson);
  }

  if( !req.body.hasOwnProperty("startTime")) {
    responseJson.message = "Missing the startTime to be set.";
    return res.status(400).json(responseJson);
  }
  
  else{
    superagent
      .post("https://api.particle.io/v1/devices/" + req.body.deviceId + "/updateStartTime")
      .type('application/x-www-form-urlencoded')
      .send({ args: req.body.startTime, access_token : particleAccessToken }) 
      .end((err, response) => {
        // console.log(response.body.return_value); //debug check particle return value
        responseJson.success = true;
        responseJson.message = "Device ID " + req.body.deviceId + " changed startTime of Measurement.";
        return res.status(200).json(responseJson);
      });
  }
});

router.post('/updateEndTime', function(req, res, next) {
  let responseJson = {
      success: false,
      message : "",
  };
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
      responseJson.message = "Missing deviceId.";
      return res.status(400).json(responseJson);
  }

  if( !req.body.hasOwnProperty("endTime")) {
    responseJson.message = "Missing the endTime to be set.";
    return res.status(400).json(responseJson);
  }
  
  else{
    superagent
      .post("https://api.particle.io/v1/devices/" + req.body.deviceId + "/updateEndTime")
      .type('application/x-www-form-urlencoded')
      .send({ args: req.body.endTime, access_token : particleAccessToken }) 
      .end((err, response) => {
        // console.log(response.body.return_value); //debug check particle return value
        responseJson.success = true;
        responseJson.message = "Device ID " + req.body.deviceId + " changed endTime of Measurement.";
        return res.status(200).json(responseJson);
      });
  }
});

/**
 * Endpoint for deleting a device on the server.
 * Remove device with the provided deviceId
 */
/* -------------------------------------------------------------------- */
router.post('/delete', function(req, res, next) {
  Device.remove({deviceId: req.body.deviceId}, function(err, device) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (!device) {
      res.status(401).json({ success: false, message: "We don't have this device in DB." });
    }
    else {
      res.status(200).json({ success: true, 
        message: `Removed Device with the ID: ${req.body.deviceId}.` });
    }
  });
});
/* -------------------------------------------------------------------- */

module.exports = router;
