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
/* -------------------------------------------------------------------- */
// let patientName = "";
let past7daysData = [];
let patientNumOfDevice = 0;
let count = 0;
let patientAllData = [];
let showPatientDetailClicked = false;
let startTimeIsInit = true;
let endTimeIsInit = true;

let patientAllDevice = [];


function sendAccountRequest() {
    $.ajax({
      url: '/physician/account',
      method: 'GET',
      headers: { 'x-auth' : window.localStorage.getItem("authToken") },
      dataType: 'json'
    })
      .done(accountInfoSuccess)
      .fail(accountInfoError);
}
  
function accountInfoSuccess(data, textStatus, jqXHR) {
    // console.log(data.patients);
    $('#email').html(data.email);
    $('#fullName').html(data.fullName);
    $('#lastAccess').html(moment(data.lastAccess).format("llll"));
    $('#main').show();
    
    // Add the patients to the list
    for(let i = 0; i < data.patients.length; i++){

        $("#patientsList").append(`<li class='collection-item patients' value="${data.patients[i].user.email}" id="${(data.patients[i].user.fullName).split(" ").join("")}-li">
                    <b>Patient's Name</b>:     <span id="${(data.patients[i].user.fullName).split(" ").join("")}">${data.patients[i].user.fullName}</span>&ensp;
                    <i class="fas fa-sync-alt" id="${(data.patients[i].user.fullName).split(" ").join("")}-btn" style="font-size: 14pt; color:#2C528C; "></i>
                    <span id="${(data.patients[i].user.fullName).split(" ").join("")}-data" class="patient-detail-span"></span>
                </li>`);
                // <i class="fas fa-sync-alt" id="${(data.patients[i].user.fullName).split(" ").join("")}-refresh" style="float: right;"></i>
                
                //style="display: none;

                // <div class="patientSummaryData" id="${data.patients[i].user.email}-summarydata">
                //         Average:     <span id="${data.patients[i].user.email}-avg"></span>  BPM&ensp;
                //         Max:       <span id="${data.patients[i].user.email}-max"></span>    BPM&ensp;
                //         Min:       <span id="${data.patients[i].user.email}-min"></span>    BPM
                //     </div>

                $(`#${(data.patients[i].user.fullName).split(" ").join("")}-btn`).click(function(event) {
                    //reset date-time-picker to default
                    $( "#my_date_picker" ).datepicker().datepicker("setDate", new Date());  //Default select today
                    $('#dailyStartTime').timepicker('setTime', "6:00am");   //default select 6am
                    $('#dailyEndTime').timepicker('setTime', "10:00pm");    //default select 10pm
                    getPatientDevices(data.patients[i].user.email, data.patients[i].user.fullName);
                });

                // $(`#${(data.patients[i].user.fullName).split(" ").join("")}-refresh`).click(function(event) {
                //     // console.log(data.patients[i].user.email);
                //     getPatientDevices(data.patients[i].user.email, data.patients[i].user.fullName);
                // });

        // $.ajax({
        //     url: '/physician/getPatientDevices',
        //     type: 'GET',
        //     contentType: 'application/json',
        //     data: {email: data.patients[i].user.email, patientsName: data.patients[i].user.fullName},
        //     dataType: 'json'
        //   })
        //     .done(function (data, textStatus, jqXHR) {
        //         $("#patientsList").append(`<li class='collection-item patients' value="${data.userEmail}">
        //             <b>Patient's Name</b>:     ${data.patientName}&ensp;
        //             Average:     <span id="${data.userEmail}-avg"></span>  BPM&ensp;
        //             Max:       <span id="${data.userEmail}-max"></span>    BPM&ensp;
        //             Min:       <span id="${data.userEmail}-min"></span>    BPM
        //         </li>`);
        //     })
        //     .fail( () => {
        //         console.log("Error, could not get Patient's Device Info.");
        //     });
    }
    
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

function getPatientDevices(patientEmail, patientName){
    $.ajax({
        url: '/physician/getPatientDevices',
        type: 'GET',
        contentType: 'application/json',
        data: {email: patientEmail, patientName: patientName},
        dataType: 'json'
      })
        .done(function (data, textStatus, jqXHR) {
            // console.log(data.patientName);
            // $(`#${data.patientName.split(" ").join("")}-devices`).html("");

            //rest global variables to initial
            past7daysData = [];
            patientNumOfDevice = data.respondDevice.length;
            count = 0;
            patientAllData = [];
            patientAllDevice = data.respondDevice;

            for(let i = 0; i < data.respondDevice.length; i++){
                // console.log(data.respondDevice[i].deviceId);
                // $(`#${data.patientName.split(" ").join("")}-devices`).append(`<div class="patient-devices-id">${data.respondDevice[i].deviceId}</div>`);

                $.ajax({
                    url: '/physician/getPatientData',
                    type: 'GET',
                    contentType: 'application/json',
                    data: {deviceId: data.respondDevice[i].deviceId, patientName: data.patientName},
                    dataType: 'json'
                  })
                    .done(combinePatientDevicesData)
                    .fail( () => {
                        console.log("Error, could not get Patient's data.");
                    });
            }
            // $(`#${data.patientName.split(" ").join("")}-div`).append(`<div >hi,  ${data.patientName}, ${data.userEmail}</div>`);
        })
        .fail( () => {
            console.log("Error, could not get Patient's Device Info.");
        });
}


function combinePatientDevicesData(data, textStatus, jqXHR){
    count++;
    for(let i = 0; i < data.respondDeviceData.length; i++){
        //ONLY get the past 7days data
        patientAllData.push(data.respondDeviceData[i]);
        if(moment().subtract(7, 'days').isBefore(data.respondDeviceData[i].takenTime)){
            past7daysData.push(data.respondDeviceData[i].avgBPM);
        }
    }

    if(count == patientNumOfDevice){    //ready to show summary with patient's all device data
        showPatientSummary(past7daysData, data.patientName);
    }

}

function showPatientSummary(past7daysData, patientName){
    // console.log(patientAllData);
    // console.log(past7daysData);
    let avgHeartRate = 0.0;
    let maxHeartRate = 0;
    let minHeartRate = 1000;
    let sum = 0;

    $(`#${patientName.split(" ").join("")}-data`).html("");

    if(past7daysData.length == 0){  //no data
        $(`#${patientName.split(" ").join("")}-data`).html("There are no data for this patient in the past 7 days.");
    }else{

        //Get the Max and Min, and the sum within 7 days
        for(let i = 0; i < past7daysData.length; i++){
            sum += past7daysData[i];
            if(past7daysData[i] >= maxHeartRate){
                maxHeartRate = past7daysData[i];
            }
            if(past7daysData[i] < minHeartRate){
                minHeartRate = past7daysData[i];
            }
        }

        //avg. heart rate within 7 days
        avgHeartRate = (sum / past7daysData.length).toFixed(2); //2 digits

        // console.log(avgHeartRate, maxHeartRate, minHeartRate);

        $(`#${patientName.split(" ").join("")}-data`).html(`Average:  ${avgHeartRate}    BPM&ensp;
            Max:  ${maxHeartRate}    BPM&ensp; Min:  ${minHeartRate}    BPM`);

        // plotPatientData(patientName, patientAllData);
    }
    plotPatientData(patientName, patientAllData, past7daysData, avgHeartRate, maxHeartRate, minHeartRate);
    $("#argondata").show();
    $(`#${patientName.split(" ").join("")}-data`).show();
    
}

function plotPatientData(patientName, patientAllData, past7daysData, avgHeartRate, maxHeartRate, minHeartRate){
    $("#patientName-plot-span").html(patientName);
    // console.log(patientAllData);
    if(patientAllData.length == 0){ //no data
        $("#no-data-in-7days").show();
        $(".no-data-in-select-time-range").show();
        $("#weeklyPlot").hide();
        $("#dailyPlotSeparate").hide();
    }else{
        if(past7daysData.length > 0){
            $("#no-data-in-7days").hide();
            $(".no-data-in-select-time-range").hide();
            $("#weeklyPlot").show();
            //call plotPatientWeekly
            plotPatientWeekly(avgHeartRate, maxHeartRate, minHeartRate);
        }

        plotPatientDaily(patientAllData);
        
        //Then plotPatientDaily
        $("#dailyPlotSeparate").show();

    }
}

function plotPatientWeekly(avgHeartRate, maxHeartRate, minHeartRate){
    //Delete/CLEAR the old canvas
    $("#weeklyPlot").remove();  

    //Now, create & show the plot (type: "Bar")
    $("#weeklyPlostSection").append('<canvas id="weeklyPlot"></canvas>');   //create a new canvas (same id)
    let weeklyCTX = document.getElementById('weeklyPlot').getContext('2d');
    let chart = new Chart(weeklyCTX, {
        // The type of chart we want to create
        type: 'bar',
        data: {
            labels: ['Average', 'Minimum', 'Maximum'],
            datasets: [{
                
                data: [avgHeartRate, minHeartRate, maxHeartRate],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)', //light blue
                    'rgba(255, 99, 132, 0.2)', //light red
                    'rgba(75, 192, 192, 0.2)' //light green
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },

        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 20
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        beginAtZero: true,
                        fontSize: 20
                    } 
                }]
            },
            animation: {    //Display data on the chart
                duration: 1,
                onComplete: function () {
                    var chartInstance = this.chart,
                        ctx = chartInstance.ctx;
                    ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize = 20, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
        
                    this.data.datasets.forEach(function (dataset, i) {
                        var meta = chartInstance.controller.getDatasetMeta(i);
                        meta.data.forEach(function (bar, index) {
                            var data = dataset.data[index];                            
                            ctx.fillText(data, bar._model.x, bar._model.y + 30);
                        });
                    });
                }
            }
        }
    });
}

function plotPatientDaily(AllData){
    //sort the data by the taken time
    let newData = AllData.sort( (a, b) => {
        return moment(a.takenTime).diff(b.takenTime);
    });

    let selectedDate = $("#my_date_picker").val()+'';
    let startTime = selectedDate + " " + $("#dailyStartTime").val();
    let endTime = selectedDate + " " + $("#dailyEndTime").val();
    let hoursDiff = moment(endTime).diff(moment(startTime), 'hours');

    // console.log(selectedDate,startTime, endTime,hoursDiff );

    //array for plots
    let labels = [];
    let bpmDatas = [];
    let satOxygenDatas = [];

    //Delete/CLEAR the old canvas
    $("#dailyPlot_bpm").remove(); 
    $("#dailyPlot_satOxygen").remove();  

    //Get all Today's ArgonData recorded data with
    //user defined time of day range
    for(let i = 0; i < newData.length; i++){
        if(moment(selectedDate).isSame(moment(newData[i].takenTime), 'day')    
            && moment(newData[i].takenTime).diff(moment(startTime), 'hours') >= 0
            && moment(newData[i].takenTime).diff(moment(startTime), 'minutes') >= 0
            && moment(endTime).diff(moment(newData[i].takenTime), 'hours') <= hoursDiff
            && moment(endTime).diff(moment(newData[i].takenTime), 'hours') >= 0
            && moment(endTime).diff(moment(newData[i].takenTime), 'minutes') >= 0){

                labels.push(moment(newData[i].takenTime).format('LT'));
                bpmDatas.push(newData[i].avgBPM);
                satOxygenDatas.push(newData[i].satOxygen);
        }
        
    }

    // console.log(labels, bpmDatas, satOxygenDatas);
    //No data in the selected time ranges
    if(labels.length == 0){
        $('.no-data-in-select-time-range').show();
        $("#dailyPlot_bpm_section").hide();
        $("#dailyPlot_satOxygen_section").hide();
    }
    else{
        //hide no-data-message
        // $("#dailyPlotSeparate").show();
        $('.no-data-in-select-time-range').hide();
        $("#dailyPlot_bpm_section").show();
        $("#dailyPlot_satOxygen_section").show();
    }

    /*********************************** Daily BPM Chart ******************************/
    $("#dailyPlot_bpm_section").append('<canvas id="dailyPlot_bpm"></canvas>');

    let dailyBPMCanvas = document.getElementById("dailyPlot_bpm").getContext('2d');
    let myLineChart1 = new Chart(dailyBPMCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                fill: false,
                borderColor: 'rgba(255, 99, 132, 0.5)',
                data: bpmDatas
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 14
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 14
                    }
                }]
            }
        }
    });

    /*********************************** Daily satOxygen Chart ******************************/
    $("#dailyPlot_satOxygen_section").append('<canvas id="dailyPlot_satOxygen"></canvas>');

    let dailySatOxygenCanvas = document.getElementById("dailyPlot_satOxygen").getContext('2d');
    let myLineChart2 = new Chart(dailySatOxygenCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                fill: false,
                borderColor: 'rgba(75, 192, 192, 0.5)',
                data: satOxygenDatas
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 14
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontSize: 14
                    }
                }]
            }
        }
    });
    

}

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
            url: '/physician/updateFullName',
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
            url: '/physician/updatePassword',
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

function updateDailyPlots(){
    // console.log("hi");
    // let deviceId = $('#datasheet-DeviceId').text();
    // requestDailySummaryData(deviceId);
    plotPatientDaily(patientAllData);
}

//For fixing the initial plot errors
function onTimeChange_Start() {
    if(!startTimeIsInit){
        updateDailyPlots();
    }
    startTimeIsInit = false;
}
function onTimeChange_End() {
    if(!endTimeIsInit){
        updateDailyPlots();
    }
    endTimeIsInit = false;
}


//update Patient's Device setting
function updatePatientDeviceFreq(){
    let selectedFreq = $(".frequency:selected").val();
    // let deviceId = $("#datasheet-DeviceId").text();
    console.log(selectedFreq, patientAllDevice);

    //patient might have multiples devices
    for(let i = 0; i < patientAllData.length; i++){
        //send to device and update
        $.ajax({
            url: '/devices/updateFreq', 
            type: 'POST',
            data: { 'deviceId': patientAllData[i].deviceId, 'newFrequency': selectedFreq}, 
            responseType: 'json'
        })
        .done( () => {
            $("#updatedMsg").text(`Patient's Device Frequency updated to ${selectedFreq} mins.`);
            $("#updatedMsg").show();
            //3 seconds later, hide the message
            setTimeout(function(){  
                $("#updatedMsg").text("");
                $("#updatedMsg").hide();
            }, 3000);
            console.log("update Patient's Device frequncy successfully!");
        })
        .fail(() => {
            console.log("update Patient's Device frequncy Failed!");
        });
    }

    

}
/******************************* NEW *********************************** */

$(function() {
    if (!window.localStorage.getItem("authToken")) {
        window.location.replace("login.html");
    }
    else {
      sendAccountRequest();
    }


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


    $('#my_date_picker').change(updateDailyPlots);

    //datepicker (default with current date)
    $( "#my_date_picker" ).datepicker().datepicker("setDate", new Date());
    
    //jQuery timepickers
    $('#dailyStartTime').timepicker({
        timeFormat: 'h:mm p',
        interval: 30,
        minTime: '6',
        maxTime: '10:00pm',
        defaultTime: '6',
        startTime: '6:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true,
        change: onTimeChange_Start
    });

    $('#dailyEndTime').timepicker({
        timeFormat: 'h:mm p',
        interval: 30,
        minTime: '6',
        maxTime: '10:00pm',
        defaultTime: '10:00pm',
        startTime: '6:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true,
        change: onTimeChange_End
    });

    /********************** NEW ***************************/

    $("#selectFreq").change(updatePatientDeviceFreq);
});