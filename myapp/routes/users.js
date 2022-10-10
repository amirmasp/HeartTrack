const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let User = require('../models/users');
let Device = require('../models/device');

// FIXME: This is really bad practice to put an encryption key in code.
//let secret = "notasecretkeyyet";

// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();

// Register a new user
router.post('/register', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (user) {
      res.status(401).json({ success: false, message: "This Email already registered." });
    }else{
      bcrypt.hash(req.body.password, 10, function(err, hash) {
        if (err) {
          res.status(400).json({success : false, message : err.errmsg});  
        }
        else {
          let newUser = new User({
            email: req.body.email,
            fullName: req.body.fullName,
            passwordHash: hash,
            Physician: "N/A"
          });
          console.log(newUser);
    
          newUser.save(function(err, user) {
            if (err) {
              console.log("hi");
              res.status(400).json({success: false,
                                    message: err.errmsg});
            }
            else {
              res.status(201).json({success: true,
                                    message: user.fullName + " has been created."});
            }
          });
        }
      }); 
    }
  });
   
});


// Authenticate a user
router.post('/login', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (!user) {
      res.status(401).json({ success: false, message: "Email or password invalid." });
    }
    else {
      bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
        if (err) {
          res.status(401).json({ success: false, message: "Error authenticating. Contact support." });
        }
        else if(valid) {
          let authToken = jwt.encode({email: req.body.email}, secret);

          //update user's last access time
          user.lastAccess = new Date();
          user.save( (err, user) => {
            console.log("User's LastAccess has been update.");
          });
          
          res.status(201).json({ success: true, authToken: authToken });
        }
        else {
          res.status(401).json({ success: false, message: "Email or password invalid." });
        }
      });
    }
  });
});


// Return account information
router.get('/account', function(req, res) {
  if (!req.headers["x-auth"]) {
    res.status(401).json({ success: false, message: "No authentication token."});
    return;
  }

  let authToken = req.headers["x-auth"];
  let accountInfo = { };

  try {
     // Toaken decoded
     let decodedToken = jwt.decode(authToken, secret);

     User.findOne({email: decodedToken.email}, function(err, user) {
       if (err) {
         res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
       }
       else {
         accountInfo["success"] = true;
         accountInfo["email"] = user.email;
         accountInfo["fullName"] = user.fullName;
         accountInfo["lastAccess"] = user.lastAccess;
         accountInfo['devices'] = [];   // Array of devices
         accountInfo['physician'] = user.Physician;
          
         // TODO: Get devices registered by uses from devices collection
         // Add each device to the accountInfo['devices'] array
         Device.find({userEmail: decodedToken.email}, function(err, devices) {
            if (err) {
              res.status(400).json({success: false, message: "can not connect to database, contact support."});

            }
            else {
              for (let device of devices) {
                accountInfo['devices'].push({deviceId: device.deviceId, apikey: device.apikey});
              }
              res.status(200).json(accountInfo);
            }
         });

       }
     });
  }
  catch (ex) {
    // Token was invalid
    res.status(401).json({ success: false, message: "Invalid authentication token."});
  }
});

//Return user's devices
router.get('/getDevices', function(req, res) {
  if (!req.headers["x-auth"]) {
    res.status(401).json({ success: false, message: "No authentication token."});
    return;
  }

  let authToken = req.headers["x-auth"];
  let devicesInfo = { };

  try {
     // Toaken decoded
      let decodedToken = jwt.decode(authToken, secret);

      Device.find({userEmail: decodedToken.email}, function(err, devices) {
        if (err) {
          res.status(400).json({success: false, message: "can not connect to database, contact support."});

        }
        else {
          devicesInfo['userEmail'] = decodedToken.email;
          devicesInfo['devices'] = [];
          for (let device of devices) {
            devicesInfo['devices'].push({deviceId: device.deviceId, apikey: device.apikey});
          }
          // console.log(devicesInfo);
          res.status(200).json(devicesInfo);
        }
      });
  }
  catch (ex) {
    // Token was invalid
    res.status(401).json({ success: false, message: "Invalid authentication token."});
  }
});

/******************************* Update Info *********************************** */
// Update User's FullName
router.post('/updateUserFullName', function(req, res) {
    User.findOne({email: req.body.email}, function(err, user) {
        if (err) {
            res.status(400).json({success: false, message: "can not connect to database, contact support."});
        }
        else {
            //update new Data
            user.fullName = req.body.fullName;
            user.save(function (err, user) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});
                }else{
                    res.status(200).json({success: true, message: "User's FullName has been changed."});
                }
            });
            
        }
    });
        
});


// Update User's Password
router.post('/updateUserPassword', function(req, res) {
    //Hash new password
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        if (err) {
            res.status(400).json({success : false, message : err.errmsg});  
        }
        else {
            User.findOne({email: req.body.email}, function(err, user) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});
                }
                else {
                    //update new Data
                    user.passwordHash = hash;
                    user.save(function (err, user) {
                        if (err) {
                            res.status(400).json({success: false, message: "can not connect to database, contact support."});
                        }else{
                            res.status(200).json({success: true, message: "User's Password has been changed."});
                        }
                    });
                    
                }
            });
        }
    });
        
});


// Update User's HeartRate Data
router.post('/updateBPMdatas', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
      if (err) {
          res.status(400).json({success: false, message: "can not connect to database, contact support."});
      }
      else {
          //update new Data
          user.avgBPM = req.body.avgHeartRate;
          user.maxBPM = req.body.maxHeartRate;
          user.minBPM = req.body.minHeartRate;
          user.save(function (err, user) {
              if (err) {
                  res.status(400).json({success: false, message: "can not connect to database, contact support."});
              }else{
                  res.status(200).json({success: true, message: "User's BPM data has been changed."});
              }
          });
          
      }
  });
      
});


// Update User's Physician
router.post('/updatePhysician', function(req, res) {
  console.log(req.body.physicianName);
  User.findOne({email: req.body.email}, function(err, user) {
      if (err) {
          res.status(400).json({success: false, message: "can not connect to database, contact support."});
      }
      else {
          //update new Data
          user.Physician = req.body.physicianName;
          user.save(function (err, user) {
              if (err) {
                  res.status(400).json({success: false, message: "can not connect to database, contact support."});
              }else{
                  res.status(200).json({success: true, message: "User's Physician has been changed."});
              }
          });
          
      }
  });
      
});


/******************************* NEW *********************************** */

module.exports = router;