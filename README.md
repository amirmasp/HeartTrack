University of Arizona
Fall 2020 - ECE 513 Final Project



/*********************************************************/
Project Description:
	The HeartTrack application is a low-cost IoT enabled web app for monitoring heart rate and blood oxygen saturation level throughout the day at a user (or physicians) rate. The IoT device uses a heart rate and oxygen sensor and will periodically remind users to take heart rate and blood oxygen saturation level measurements. The IoT device will transmit measurements to a web application through which users (or physicians) can view their data. Supports a weekly summary view and detailed day view.
/*********************************************************/





/*********************************************************/
/******************** WORKING ENDPOINTS  ************************/
/*********************************************************/

	For IoT measurements:  (routes/argon.js)
//-------------------------------------------------//
	1. URL: "/argon/data",  //ex: "http://18.217.151.193:3000/argon/data?deviceId=e00fce68b392d299deb79817"
	   Description: This endpoint is to get all measurements from the database for the specify registered device.
	   Method: "GET",
	   Data sent: deviceId,
	   Respond data formats: 'json'.
		- example:
                        { "success": "true",
			     "message": "Device data are sent.",
			     "respondDeviceData":
				[{
				"deviceId": "abc123",
				"satOxygen": "50.0",
				"avgBPM": "50.0",
				"takenTime": "01-01-2020"}, {....}, {...}]
			   }
                or  
                        {"success": "false",
                         "message": "Error contacting DB. Please contact support."
                         }

	   Response codes:
		- Success : 200, Error/Fail: 400

	2. URL: "/argon/report"
	   Description: This endpoint is for the IoT device to POST/upload the measured data to the database, it will find the device and verify the provide apiKey. Once approval, automatically create a new ArgonData object that contained all device information and measurements and stored it in the database.
	   Method: "POST"
	   Data sent: deviceId, apikey, avgBPM, satOxygen.
	   Respond data formats: 'json'.
		- example: { "status": "OK",
			     "message": "Data saved in db with object ID {example_ObjectID}." }
                or
                    {"status": "ERROR",
                    "message": "Error saving data in db." }
                or
                    {"status": "ERROR",
                    "message": "Device ID xxxExampleIDxxx not registered." }
                ....
                (more error handler respond data)

	   Response codes: 201 (Created)

//-------------------------------------------------//



	For Devices:  (routes/devices.js)
//-------------------------------------------------//
	1. URL: "/devices/register"
	   Description: This endpoint is for the user to register their device by providing a device ID, and randomly generate a apikey for the authorization. If authoToken is provided, use User's email in authToken and it will decoded with a secret key. Look for the deviceId and see if its already registered, if not, create a new Device object with device's info and store in the database.
	   Method: "POST",
	   Data sent: deviceId, email
	   Respond data formats: 'json'.
		- example: { "registered": "true",
			     "apikey": "example_apikey123",
			     "deviceId": "example_deviceId123",
			     "message": "Device ID example_deviceId123 was registered."
			   }
                    or
                            {"registered": "false",
                            "apikey": "",
                            "deviceId": "example_deviceId123",
                            "message": "Device ID example_deviceId123 already registered."
                                }

	   Response codes:
		- Success : 201, Error/Fail: 400


	2. URL: "/devices/delete"
	   Description: This endpoint is to delete a user's registered device on the database by providing the device ID.
	   Method: "POST",
	   Data sent: deviceId
	   Respond data formats: 'json'.
		- example: { "success": "true",
			     "message": "Removed Device with the ID example_deviceId123."
			   }

            or
                {"success": "false",
                 "message": "We don't have this device in DB."
                }

	   Response codes:
		- Success : 200, Error/Fail: 401

//-------------------------------------------------//



	For Users:  (routes/users.js)
//-------------------------------------------------//
	1. URL: "/users/register"
	   Description: This endpoint is for registering a user account before login to the application. It will check if the user is registered before added to the database. and then bcrypt the password with hash to protect user account and ensure properly secured.
	   Method: "POST",
	   Data sent: email, fullName, password
	   Respond data formats: 'json'.
		- example: { "success": "true",
			     "message": "User1 has been created."
			   }
               or Errors respond:
                           {"success": "false",
                           "message": "This Email already registered."
                           }
                           ... (more error handler respond data)

	   Response codes:
		- Success : 201, Error/Fail: 400

	2. URL: "/users/login"
	   Description: This endpoint is to authenticate a user when they login to their account.
	   Method: "POST",
	   Data sent: email, password
	   Respond data formats: 'json'.
		- example: { "success": "true",
			     "authToken": "authToken"
			   }
			or
			   { "success": "false",
			     "message": "Email or password invalid."
			   }

	   Response codes:
		- Success : 201, Error/Fail: 401


	3. URL: "/users/account"
	   Description: This endpoint is to get User's account information and display on the account page, including their email, fullName, their devices and the last access time.
	   Method: "GET",
	   Data sent: authToken (headers["x-auth"]) user's email
	   Respond data formats: 'json'.
		- example: { "success": "true",
			     "email": "exampleEmail@gmail.com",
			     "fullName": "Test User1",
			     "LastAccess": "01-01-2020",
			     "devices": [{ "deviceId": "exampleID",
					   "apikey": "example_apikey",}, {...}, {...}, {...}]
			   }
            or Errors respond:
                    {"success": "false",
                    "message": "No authentication token."
                    }
            or
                   {"success": "false",
                   "message": "can not connect to database, contact support."
                   }

	   Response codes:
		- Success : 200, Error/Fail: 400, 401


	4. URL: "/users/getDevices"
	   Description: This endpoint is to get User's all registered devices from the database, and display to the front-end webpage.
	   Method: "GET",
	   Data sent: authToken (headers["x-auth"]) user's email
	   Respond data formats: 'json'.
		- example: {"devices": [{ "deviceId": "exampleID",
					   "apikey": "example_apikey",}, {...}, {...}, {...}]
			   }
			or
			   { "success": "false",
			     "message": "Invalid authentication token."
			   }

	   Response codes:
		- Success : 200, Error/Fail: 400, 401

//-------------------------------------------------//
