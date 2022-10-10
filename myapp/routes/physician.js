const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let Physician = require('../models/physician');
let User = require('../models/users');
let Device = require('../models/device');
let ArgonData = require("../models/argondata");


// FIXME: This is really bad practice to put an encryption key in code.
//let secret = "notasecretkeyyet";

// On Repl.it, add JWT_SECRET to the .env file, and use this code
// let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();

// Register a new user
router.post('/register', function(req, res) {
    Physician.findOne({email: req.body.email}, function(err, user) {
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
                    let newPhysician = new Physician({
                        email: req.body.email,
                        fullName: req.body.fullName,
                        passwordHash: hash,
                        patient: []
                    });
                    
                    newPhysician.save(function(err, physician) {
                        if (err) {
                        res.status(400).json({success: false,
                                                message: err.errmsg});
                        }
                        else {
                        res.status(201).json({success: true,
                                                message: "Physician" + physician.fullName + " has been created."});
                        }
                    });
                }
            }); 
        }
    });
   
});


// Authenticate a physician
router.post('/login', function(req, res) {
    Physician.findOne({email: req.body.email}, function(err, physician) {
        if (err) {
            res.status(401).json({ success: false, message: "Can't connect to DB." });
        }
        else if (!physician) {
            res.status(401).json({ success: false, message: "Email or password invalid." });
        }
        else {
            bcrypt.compare(req.body.password, physician.passwordHash, function(err, valid) {
                if (err) {
                    res.status(401).json({ success: false, message: "Error authenticating. Contact support." });
                }
                else if(valid) {
                        let authToken = jwt.encode({email: req.body.email}, secret);

                        //update user's last access time
                        physician.lastAccess = new Date();
                        physician.save( (err, physician) => {
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


// Return physician information
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

        Physician.findOne({email: decodedToken.email}, function(err, physician) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }
        else {
            accountInfo["success"] = true;
            accountInfo["email"] = physician.email;
            accountInfo["fullName"] = physician.fullName;
            accountInfo["lastAccess"] = physician.lastAccess;
            accountInfo['patients'] = [];   // Array of devices
            
            
            // Add each user has the same physician to the accountInfo['patients'] array
            User.find({Physician: physician.fullName}, function(err, users) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});

                }
                else {
                    for (let user of users) {
                        accountInfo['patients'].push({user});
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

router.get('/getAll', function(req, res) {
    Physician.find({}, function(err, physicians) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }
        else {
            res.status(200).json({ success: true, 
                message: "All Physician data has been sent.",
                physicians: physicians
            });
        } 
    })
});

/******************************* NEW *********************************** */
// Update Physician's FullName
router.post('/updateFullName', function(req, res) {
    Physician.findOne({email: req.body.email}, function(err, physician) {
        if (err) {
            res.status(400).json({success: false, message: "can not connect to database, contact support."});
        }
        else {
            //update new Data
            physician.fullName = req.body.fullName;
            physician.save(function (err, physician) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});
                }else{
                    res.status(200).json({success: true, message: "Physician's FullName has been changed."});
                }
            });
            
        }
    });
        
});


// // Update User's Password
router.post('/updatePassword', function(req, res) {
    
    //Hash new password
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        if (err) {
            res.status(400).json({success : false, message : err.errmsg});  
        }
        else {
            Physician.findOne({email: req.body.email}, function(err, physician) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});
                }
                else {
                    //update new Data
                    physician.passwordHash = hash;
                    physician.save(function (err, physician) {
                        if (err) {
                            res.status(400).json({success: false, message: "can not connect to database, contact support."});
                        }else{
                            res.status(200).json({success: true, message: "Physician's Password has been changed."});
                        }
                    });
                    
                }
            });
        }
    });
        
});



router.get('/getPatientDevices', function(req, res) {
    Device.find({userEmail: req.query.email}, function(err, devices) {
        if (err) {
          res.status(400).json({success: false, message: "can not connect to database, contact support."});

        }
        else {
            res.status(200).json({ success: true, 
                message: "Device data are sent.",
                respondDevice: devices,
                userEmail: req.query.email,
                patientName: req.query.patientName
            });
        }
      });
});

router.get('/getPatientData', function(req, res) {
    ArgonData.find({deviceId: req.query.deviceId}, function(err, data) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }
        else {
            res.status(200).json({ success: true, 
                message: "Device data are sent.",
                respondDeviceData: data, //return all ArgonData with the same device ID
                deviceId: req.query.deviceId,
                patientName: req.query.patientName
            });
        } 
    })
});


router.post('/removePatient', function(req, res, next) {
    let index = -1;
    Physician.findOne({fullName: req.body.previousPhysicianName}, function(err, physician) {
        if (err) {
            res.status(400).json({success: false, message: "can not connect to database, contact support."});
        }else if(!physician){
            res.status(400).json({success: false, message: `Can not found this patient in Physician ${req.body.physicianName}'s patient list.`});
            return;
        }
        else {
            //update new Data

            //find the index of the matched patient
            for(let i = 0; i < physician.patient.length; i++){
                // console.log(physician.patient[i].fullName);
                if(physician.patient[i].email == req.body.patientEmail){
                    index = i;
                }
            }

            if(index == -1){   //the given patient in not the this physician's patient list
                res.status(400).json({success: false, message: `Can not found this patient in Physician ${req.body.physicianName}'s patient list.`});
                return;
            }else{
                //remove the patient from physician's list
                physician.patient.splice(index, 1);
                physician.save(function (err, physician) {
                if (err) {
                    res.status(400).json({success: false, message: "can not connect to database, contact support."});
                }else{
                    res.status(200).json({success: true, message: "Physician's patient list has been updated."});
                }
                });
            }
            
            
        }
    });
});

router.get('/getOnePhysicianInfo', function(req, res) {
    Physician.findOne({fullName: req.query.physicianName}, function(err, physician) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }else if(!physician){
            res.status(400).json({ success: false, message: `There is no Physician called ${req.query.physicianName}.`});
            return;
        }
        else {
            res.status(200).json({ success: true, 
                message: "User's Current Physician data has been sent.",
                physician: physician
            });
        } 
    })
});

router.post('/addPatient', function(req, res) {


    User.findOne({email: req.body.patientEmail}, function(err, user) {
        if (err) {
            res.status(400).json({success: false, message: "1can not connect to database, contact support."});
        }
        else {
            Physician.findOne({fullName: req.body.physicianName}, function(err, physician) {
                if (err) {
                    res.status(400).json({success: false, message: "2can not connect to database, contact support."});
                }
                else if(!physician){
                    res.status(400).json({success: false, message: `No Physician called ${req.body.physicianName}.`});
                }
                else {
                    physician.patient.push(user);
                    console.log(physician);
                    physician.save(function (err, physician) {
                        if (err) {
                            res.status(400).json({success: false, message: "3can not connect to database, contact support."});
                        }else{
                            res.status(200).json({success: true, 
                                message: `Physician's Patient List has been Updated, inserted patient ${user.fullName}. `});
                        }
                    });
                    
                    
                }
            });
            // //update new Data
            // physician.fullName = req.body.fullName;
            // physician.save(function (err, physician) {
            //     if (err) {
            //         res.status(400).json({success: false, message: "can not connect to database, contact support."});
            //     }else{
            //         res.status(200).json({success: true, message: "Physician's FullName has been changed."});
            //     }
            // });
            
        }
    });
        
});
/******************************* NEW *********************************** */

module.exports = router;