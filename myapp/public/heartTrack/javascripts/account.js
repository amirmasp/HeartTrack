/**
 * Global variables
 * All of these value should be passed ( = 1) before Account Registration
 * to ensure strong password
 */
/* -------------------------------------------------------------------- */
let lengthCheck = 0;
let lowercaseCheck = 0;
let uppercaseCheck = 0;
let digitCheck = 0;
let strongPasswordPassed = 0;
let previousPhysicianName = "N/A";
/* -------------------------------------------------------------------- */

function sendAccountRequest() {
    $.ajax({
      url: '/users/account',
      method: 'GET',
      headers: { 'x-auth' : window.localStorage.getItem("authToken") },
      dataType: 'json'
    })
      .done(accountInfoSuccess)
      .fail(accountInfoError);

      loadAllPhysicianToList();
}

function loadAllPhysicianToList(){
    //Load all Registered Physician to the selection list
    $.ajax({
        url: '/physician/getAll',
        method: 'GET',
        dataType: 'json'
      })
        .done(loadAllPhysicianSuccess)
        .fail(function(jqXHR, textStatus, errorThrown) {
            let response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
          });
}
  
function accountInfoSuccess(data, textStatus, jqXHR) {
    $('#email').html(data.email);
    $('#fullName').html(data.fullName);
    $('#lastAccess').html(moment(data.lastAccess).format("llll"));
    $('#main').show();
  
    // Add the devices to the list before the list item for the add device button (link)
    for (let device of data.devices) {
      $("#addDeviceForm").before(`<li class='collection-item ${device.deviceId}-li'>ID: ` +
        device.deviceId + ", APIKEY: " + device.apikey + " </li>");
    }

    //get user's current physician's info and load on the page
    loadCurrentPhysicianOnPage(data.physician);
}
  
function accountInfoError(jqXHR, textStatus, errorThrown) {
    // If authentication error, delete the authToken 
    // redirect user to sign-in page (which is login.html)
    if (jqXHR.status == 401) {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("userType");
      window.location = "login.html";
    } 
    else {
      $("#error").html("Error: " + jqXHR.status);
      $("#error").show();
    }
}

function loadCurrentPhysicianOnPage(physicianName){

    if(physicianName == "N/A"){
        $("#physicianInfoSection").hide();
    }else{
        $("#physicianInfoSection").show();
        //get user's current physician's info and load on the page
        $.ajax({
            url: '/physician/getOnePhysicianInfo',
            method: 'GET',
            data: {physicianName: physicianName},
            dataType: 'json'
        })
            .done(function (data, textStatus, jqXHR) {
                //add User's Current Physician's Info on page
                $("#currentPhysicianInfo").html("");
                $("#currentPhysicianInfo").append(`
                <li class="collection-item">
                    Name: <span id="previousPhysicianName">${data.physician.fullName}</spam>
                </li>
                <li class="collection-item">
                    Email: ${data.physician.email}
                </li>
                `);
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log("Error to get Physician's Info");
            });
    }
    
}


/**
 * Successfully get all physicians info
 * Load all Physician's name to the list
 */
function loadAllPhysicianSuccess(data, textStatus, jqXHR) {
    //clear the previous data list
    $("#selectPhysician").html("");

    //make a new list
    $("#selectPhysician").append(`<option value="N/A">N/A</option>`);
    for(let i = 0; i < data.physicians.length; i++){
        $("#selectPhysician").append(
            `<option value="${data.physicians[i].fullName}">${data.physicians[i].fullName}
            </option>`);
    }
}

  // Registers the specified device with the server.
function registerDevice() {
    $.ajax({
      url: '/devices/register',
      method: 'POST',
      headers: { 'x-auth': window.localStorage.getItem("authToken") },  
      contentType: 'application/json',
      data: JSON.stringify({ deviceId: $("#deviceId").val() }), 
      dataType: 'json'
     })
       .done(function (data, textStatus, jqXHR) {
         // Add new device to the device list
         $("#addDeviceForm").before(`<li class='collection-item ${$("#deviceId").val()}-li'>ID: ` +
         $("#deviceId").val() + ", APIKEY: " + data["apikey"] + "</li>");

         hideAddDeviceForm();
       })
       .fail(function(jqXHR, textStatus, errorThrown) {
         let response = JSON.parse(jqXHR.responseText);
         $("#error").html("Error: " + response.message);
         $("#error").show();
       }); 
}
  
//   function pingDevice(event, deviceId) {
//      $.ajax({
//           url: '/devices/ping',
//           type: 'POST',
//           headers: { 'x-auth': window.localStorage.getItem("authToken") },   
//           data: { 'deviceId': deviceId }, 
//           responseType: 'json',
//           success: function (data, textStatus, jqXHR) {
//               console.log("Pinged.");
//           },
//           error: function(jqXHR, textStatus, errorThrown) {
//               var response = JSON.parse(jqXHR.responseText);
//               $("#error").html("Error: " + response.message);
//               $("#error").show();
//           }
//       }); 
//   }

//---------------------------------------------------------------------------//

 //---------------------------------------------------------------------------//


  
  // Show add device form and hide the add device button (really a link)
  function showAddDeviceForm() {
    $("#deviceId").val("");          // Clear the input for the device ID
    $("#addDeviceControl").hide();   // Hide the add device link
    $("#addDeviceForm").slideDown(); // Show the add device form
  }
  
  // Hides the add device form and shows the add device button (link)
  function hideAddDeviceForm() {
    $("#addDeviceControl").show();   // Hide the add device link
    $("#addDeviceForm").slideUp();   // Show the add device form
    $("#error").hide();
  }



/**
 * Slide up / Show the option of devices to be removed 
 * Send a GET request to the server, and get all devices for the user
 */
/* -------------------------------------------------------------------- */
function showDeleteDeviceForm(){

    $.ajax({
      url: '/users/getDevices',
      method: 'GET',
      headers: { 'x-auth' : window.localStorage.getItem("authToken") },
      dataType: 'json'
    })
      .done(getDevicesSuccess)
      .fail(function(jqXHR, textStatus, errorThrown) {
        let response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
      }); 

    $("#deleteDeviceControl").hide();   // Hide the Delete device link
    $("#deleteDeviceForm").slideDown(); // Show the Delete device form
}
/* -------------------------------------------------------------------- */



  /**
   * Add all response data (devices) to the page (Radio buttons)
   */
  /* -------------------------------------------------------------------- */
function getDevicesSuccess(data, textStatus, jqXHR){
    for (let device of data.devices) {
      document.getElementById("deviceList").innerHTML +=`
      <div id="${device.deviceId}-label">
      <label class = "mdl-radio mdl-js-radio" for = "${device.deviceId}">
        <input type = "radio" id = "${device.deviceId}" value = "${device.deviceId}" name = "userDevices" 
            class = "mdl-radio__button delete-target-device">
        <span class = "mdl-radio__label">
          Device ID: ${device.deviceId} ,  APIKEY: ${device.apikey}
        </span>
      </label><br>
      </div>`;
    }
}
/* -------------------------------------------------------------------- */


  function hideDeleteDeviceForm(){
    $("#deviceList").html("");
    $("#deleteDeviceControl").show();   // Hide the Delete device link
    $("#deleteDeviceForm").slideUp();   // Show the Delete device form
  }



  /**
   * Delete the selected / checked devices on server
   * Method: POST
   * devideId = req.body.deviceId in the router endpoint.
   */
  /* -------------------------------------------------------------------- */
  function deleteDeviceOnServer(){
    let deleteTarget = $(".delete-target-device:checked").val();
    // console.log(deleteTarget);
    $.ajax({
      url: '/devices/delete',
      method: 'POST', 
      contentType: 'application/json',
      data: JSON.stringify({ deviceId: deleteTarget }), 
      dataType: 'json'
     })
     .done( (data, textStatus, jqXHR) => {
        $(`#${deleteTarget}-label`).remove();
        $(`.${deleteTarget}-li`).remove();
      }
     )
     .fail(function(jqXHR, textStatus, errorThrown) {
        let response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
    }); 


    //ajax call also delete this device's photon data in database
    $.ajax({
      url: '/argon/deleteArgonData',
      method: 'POST', 
      contentType: 'application/json',
      data: JSON.stringify({ deviceId: deleteTarget }), 
      dataType: 'json'
     })
     .done( (data, textStatus, jqXHR) => {
        console.log(data.message);
      }
     )
     .fail(function(jqXHR, textStatus, errorThrown) {
        let response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
    }); 
  }
  /* -------------------------------------------------------------------- */
  


/******************************* NEW *********************************** */
/**
 * Check to ensure strong password 
 */
/* -------------------------------------------------------------------- */
function ensureStrongPassword(){
  let password = $("#password").val();

  //Regular Expressions
  // let emailRegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
  let lowercaseRegExp = /^(?=.*[a-z])/;
  let uppercaseRegExp = /^(?=.*[A-Z])/;
  let digitRegExp = /[\d]{1}/;

  /**
   * Ensure the password has 10 to 20 characters
   */
  if(password.length >= 10 && password.length <= 20){
    $('#passwordLengthPassed').css("color", "darkgreen");
    lengthCheck = 1;
  }else{
    $('#passwordLengthPassed').css("color", "red");
    lengthCheck = 0;
  }

  /**
   * Ensure the password contains at least one lowercase character
   */
  if(lowercaseRegExp.test(password)){
    $('#passwordLowercasePassed').css("color", "darkgreen");
    lowercaseCheck = 1;
  }else{
    $('#passwordLowercasePassed').css("color", "red");
    lowercaseCheck = 0;
  }

  /**
   * Ensure the password contains at least one uppercase character
   */
  if(uppercaseRegExp.test(password)){
    $('#passwordUppercasePassed').css("color", "darkgreen");
    uppercaseCheck = 1;
  }else{
    $('#passwordUppercasePassed').css("color", "red");
    uppercaseCheck = 0;
  }

  /**
   * Ensure the password contains at least one digit
   */
  if(digitRegExp.test(password)){
    $('#passwordDigitPassed').css("color", "darkgreen");
    digitCheck = 1;
  }else{
    $('#passwordDigitPassed').css("color", "red");
    digitCheck = 0;
  }


  //if all conditions passed, meaning the user entered a strong password
  //otherewise, display errors
  if(lengthCheck == 1 && lowercaseCheck == 1 && uppercaseCheck == 1 && digitCheck == 1){
    strongPasswordPassed = 1;
    $('#passwordVerifictionErrors').slideUp();
    $('.password-passed').show();
    $('.password-failed').hide();
  }else{
    strongPasswordPassed = 0;
    $('#passwordVerifictionErrors').show();
    $('.password-passed').hide();
    $('.password-failed').show();
  }
  
}
/* -------------------------------------------------------------------- */

function updateFullName() {
    $("#ServerResponse").hide();

    let email = $('#email').text();
    // let password = $('#password').val();
    let fullName = $('#fullName_form').val();
    // let passwordConfirm = $('#passwordConfirm').val();
  
    //If one of the information (input) is missing, display error
    if(!fullName){
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Please fill out all information.</span>");
            $('#ServerResponse').show();
            return;
    }else{
        $('#ServerResponse').hide();
    }
        
        $.ajax({
            url: '/users/updateUserFullName',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({email: email, fullName: fullName}),
            dataType: 'json'
          })
            .done( () => {
                $("#fullName_form").val("");
                $("#myModal").hide();
                $("#fullName").text(fullName);
                $("#dataSavedMsg").html(`Your name has been updated!    <i class="fas fa-check-circle"></i>`);
                $("#dataSavedMsg").show();
                setTimeout(function(){ $("#dataSavedMsg").hide(); }, 3000);
            })
            .fail(updateError);
}

function updatePassword(){
    $("#ServerResponse").hide();

    let email = $('#email').text();
    let password = $('#password').val();
    let passwordConfirm = $('#passwordConfirm').val();
  
    //If one of the information (input) is missing, display error
    if(!password || !passwordConfirm){
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Please fill out all information.</span>");
            $('#ServerResponse').show();
            return;
    }else{
        $('#ServerResponse').hide();
    }

    // Check to make sure the passwords match
    if (password != passwordConfirm) {
        $('.confirmPassword-failed').show();
        $('.confirmPassword-passed').hide();
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Passwords do not match.</span>");
        $('#ServerResponse').show();
        return;
    }else{
        $('.confirmPassword-passed').show();
        $('.confirmPassword-failed').hide();
        $('#ServerResponse').hide();
        
        $.ajax({
            url: '/users/updateUserPassword',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({email: email, password: password}),
            dataType: 'json'
          })
            .done( () => {
                $("#password").val("");
                $("#passwordConfirm").val("");

                hidePasswordVerifiction();
            
                $("#myModal").hide();
                $("#dataSavedMsg").html(`Your Password has been updated!    <i class="fas fa-check-circle"></i>
                                                Sign out in 3 seconds!`);
                $("#dataSavedMsg").show();
                setTimeout(function(){  //sign out in 3 seconds
                    $("#dataSavedMsg").hide(); 
                    //sign out after change password 
                    window.localStorage.removeItem("authToken");
                    window.localStorage.removeItem("userType");
                    window.location.replace("login.html");
                }, 3000);
                
            })
            .fail(updateError);
    }
}
  
  /* -------------------------------------------------------------------- */
function updateError(jqXHR, textStatus, errorThrown) {
    if (jqXHR.status == 401 ) {
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " +
                                  jqXHR.responseJSON.message +"</span>");
        $('#ServerResponse').show();
     }
     else {
        $('#ServerResponse').html("<span class='red-text text-darken-2'>Server could not be reached.</span>");
        $('#ServerResponse').show();
     }
}
  /* -------------------------------------------------------------------- */


function showUpdateNameForm(){
    $("#updateFullNameForm").show();
    $("#updatePasswordLink").show();
    $("#updateFullNameBtn").show();
    $("#updatePasswordForm").hide();
    $("#ServerResponse").hide();
}

function showUpdatePasswordForm(){
    $("#ServerResponse").hide();
    $("#updatePasswordLink").hide();
    $("#updateFullNameForm").hide();
    $("#updateFullNameBtn").hide();
    $("#updatePasswordForm").show();
    hidePasswordVerifiction();
    $("#password").val("");
    $("#passwordConfirm").val("");
}

function hidePasswordVerifiction(){
    $(".password-passed").hide();
    $(".password-failed").hide();
    $(".confirmPassword-passed").hide();
    $(".confirmPassword-failed").hide();
    $("#passwordVerifictionErrors").hide();
}

function changePhysicianForUser(){

    let physician = $("option:selected").val();
    // let previousPhysician = $("#previousPhysicianName").text();
    let userEmail = $("#email").text();
    // console.log(userEmail, physician);

    //save patient's info with the new Physician
    $.ajax({
        url: '/users/updatePhysician',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({email: userEmail, physicianName: physician}),
        dataType: 'json'
      })
        .done( () => {
            console.log("User's Physician has been updated!");
            //and show the selected physician's info on page
        })
        .fail(updateError);
    
    console.log("Previous: "+previousPhysicianName, "Current: "+physician);
    

    //remove user from the previous physician
    $.ajax({
        url: '/physician/removePatient',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({patientEmail: userEmail, previousPhysicianName: previousPhysicianName}), 
        dataType: 'json'
      })
        .done( () => {
            console.log("Previous Physician has remove this patient!");
            //and show the selected physician's info on page
        })
        .fail(updateError);
    //update previous Physician to current for future data fetch
    previousPhysicianName = physician;

    //add user to the new physician's patient list
    $.ajax({
        url: '/physician/addPatient',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({patientEmail: userEmail, physicianName: physician}),  
        dataType: 'json'
      })
        .done( () => {
            console.log("Physician's patient list has insert this patient!");
            //and show the selected physician's info on page
        })
        .fail(updateError);

    //load new physician info on page
    loadCurrentPhysicianOnPage(physician);
}

/******************************* NEW *********************************** */

$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("login.html");
    }
    else {
      sendAccountRequest();
    }
    //hidden both form when login to the page
    hideAddDeviceForm();
    hideDeleteDeviceForm();
    // Register event listeners
    $("#addDevice").click(showAddDeviceForm);
    $("#registerDevice").click(registerDevice);  
    $("#cancel").click(hideAddDeviceForm);  
    $('#deleteDevice').click(showDeleteDeviceForm);
    $("#cancelDelete").click(hideDeleteDeviceForm);
    $("#deleteDeviceBtn").click(deleteDeviceOnServer);

    //Select Physician
    $("#selectPhysician").click(loadAllPhysicianToList);
    $("#selectPhysician").change(changePhysicianForUser);


    /********************** NEW ***************************/
    $("#updateAccInfoBtn").click( () => {  //show modal
        showUpdateNameForm();
        hidePasswordVerifiction();
        $("#myModal").show();
    });

    $(".close").click( () => {  //hide modal
        $("#fullName_form").val("");
        $("#password").val("");
        $("#passwordConfirm").val("");
        hidePasswordVerifiction();
        $("#myModal").hide();
    });

    $("#password").keyup(ensureStrongPassword);
    $("#updateFullNameBtn").click(updateFullName);
    $("#updatePasswordBtn").click(updatePassword);

    $("#updatePasswordLink").click(showUpdatePasswordForm);
    $("#cancelUpdatePasswordBtn").click(showUpdateNameForm);

    $("#passwordConfirm").keypress(function(event) {
        if (event.which === 13) { //hit enter
            updatePassword();
        }
    });

    $("#fullName_form").keypress(function(event) {
        if (event.which === 13) { //hit enter
            updateFullName();
        }
    });

    /********************** NEW ***************************/
});