let express = require('express');
let router = express.Router();
let Device = require("../models/device");
let ArgonData = require("../models/argondata");
let moment = require('moment');



// Return device data
router.get('/allData', function(req, res) {
 
    // let deviceData = { };
    ArgonData.find({deviceId: req.query.deviceId}, function(err, data) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }
        else {
            res.status(200).json({ success: true, 
                message: "Device data are sent.",
                respondDeviceData: data //return all ArgonData with the same device ID
            });
        } 
    });
});


// Return device weekly data
router.get('/weeklySummaryData', function(req, res) {

    let returnData = [];
    ArgonData.find({deviceId: req.query.deviceId}, function(err, data) {
        if (err) {
            res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
        }
        else {
            //Get all recorded data thats within 7 days
            for(let i = 0; i < data.length; i++){
                if(moment().subtract(7, 'days').isBefore(data[i].takenTime)){
                    returnData.push(data[i]);
                }
            }
            res.status(200).json({ success: true, 
                message: "Device data are sent.",
                respondDeviceData: returnData //return all ArgonData within 7 days
            });
        } 
    });
});

// Delete device's data
router.post('/deleteArgonData', function(req, res) {
    ArgonData.remove({deviceId: req.body.deviceId}, function(err, datas) {
        if (err) {
          res.status(401).json({ success: false, message: "Can't connect to DB." });
        }
        else if (!datas) {
          res.status(401).json({ success: false, message: "We don't have this device in DB." });
        }
        else {
          res.status(200).json({ success: true, 
            message: `Removed Argon data for the Device ID: ${req.body.deviceId}.` });
        }
      });
  
});


// Return device daily data
// router.get('/dailySummaryData', function(req, res) {

//     let selectedDate = moment(req.query.selectedDate);
//     let startTime = moment(req.query.startTime);
//     let endTime = moment(req.query.endTime);
//     let hoursDiff = endTime.diff(startTime, 'hours');
//     console.log(selectedDate.format('l'),startTime.format("LT"),endTime.format("LT") ); 
//     let returnTimes = [];
//     let returnBPMs = [];
//     let returnSatOxygen = [];
//     ArgonData.find({deviceId: req.query.deviceId}, function(err, data) {
//         if (err) {
//             res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
//         }
//         else {
//             //Get all Today's ArgonData recorded data with
//             //user defined time of day range
//             for(let i = 0; i < data.length; i++){
//               console.log(moment(data[i].takenTime).format("lll"))
//                 if(selectedDate.isSame(data[i].takenTime, 'day')    
//                     && moment(data[i].takenTime).diff(startTime, 'hours') >= 0
//                     && moment(data[i].takenTime).diff(startTime, 'minutes') >= 0
//                     && endTime.diff(moment(data[i].takenTime), 'hours') <= hoursDiff
//                     && endTime.diff(moment(data[i].takenTime), 'hours') >= 0
//                     && endTime.diff(moment(data[i].takenTime), 'minutes') >= 0){

//                         returnTimes.push(data[i].takenTime);
//                         returnBPMs.push(data[i].avgBPM);
//                         returnSatOxygen.push(data[i].satOxygen);
//                 }
//             }
//             // console.log(returnData);
//             res.status(200).json({ success: true, //return all Today's ArgonData recorded data
//                 message: "Device data are sent.",
//                 returnTimes: returnTimes,
//                 returnBPMs: returnBPMs,
//                 returnSatOxygen: returnSatOxygen
//             });
//         } 
//     });
// });



// GET request return one or "all" devices registered and last time of contact.
/*router.get('/status/:devid', function(req, res, next) {
  let deviceId = req.params.devid;
  let responseJson = { devices: [] };
  let query = {};

  if (deviceId != "all") {
    query = {
      "deviceId" : deviceId
    };
  }

  Device.find(query, function(err, allDevices) {
    if (err) {
      let errorMsg = {"message" : err};
      res.status(400).json(errorMsg);
    }
    else {
      for (let doc of allDevices) {
        responseJson.devices.push({ "deviceId": doc.deviceId,  "apiKey": doc.apikey, "lastContact" : doc.lastContact});
      }
    }
    res.status(200).json(responseJson);
  });
});*/


/* POST: Add data. */
//Assume data taken from sensor is posted by webhook with this endpoint: ourDomainNmae/argon/report
router.post('/report', function(req, res, next) {
  var responseJson = {
    status : "",
    message : ""
  };

  // Ensure the POST data include all properties
  if( !req.body.hasOwnProperty("deviceId") ) {
    responseJson.status = "ERROR";
    responseJson.message = "Request missing deviceId parameter.";
    return res.status(201).send(JSON.stringify(responseJson));
  }

  if( !req.body.hasOwnProperty("apikey") ) {
    responseJson.status = "ERROR";
    responseJson.message = "Request missing apikey parameter.";
    return res.status(201).send(JSON.stringify(responseJson));
  }

  if( !req.body.hasOwnProperty("avgBPM") ) {
    responseJson.status = "ERROR";
    responseJson.message = "Request missing avgBPM parameter.";
    return res.status(201).send(JSON.stringify(responseJson));
  }

  if( !req.body.hasOwnProperty("satOxygen") ) {
    responseJson.status = "ERROR";
    responseJson.message = "Request missing satOxygen parameter.";
    return res.status(201).send(JSON.stringify(responseJson));
  }



  // Find the device and verify the apikey
  Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
    if (device !== null) {
      if (device.apikey != req.body.apikey) {
        responseJson.status = "ERROR";
        responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
        return res.status(201).send(JSON.stringify(responseJson));
      }
      else {
        // Create a new hw data with user email time stamp
        var newArgonData = new ArgonData({
          deviceId: req.body.deviceId,
          avgBPM: req.body.avgBPM,
          satOxygen: req.body.satOxygen,
          takenTime: req.body.takenTime
        });

        // Save device. If successful, return success. If not, return error message.
        newArgonData.save(function(err, newArgonData) {
          if (err) {
            responseJson.status = "ERROR";
            responseJson.message = "Error saving data in db.";
            return res.status(201).send(JSON.stringify(responseJson));
          }
          else {
            responseJson.status = "OK";
            responseJson.message = `Data saved in db with object ID ` + newArgonData._id + ".";
            return res.status(201).send(JSON.stringify(responseJson));
          }
        });
      }
    }
    else {
      responseJson.status = "ERROR";
      responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
      return res.status(201).send(JSON.stringify(responseJson));
    }
  });
});

module.exports = router;
