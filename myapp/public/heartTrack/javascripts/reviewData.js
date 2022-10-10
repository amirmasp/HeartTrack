// const { max } = require("moment");

let startTimeIsInit = true;
let endTimeIsInit = true;
let userEmail;

function sendAccountDevicesRequest() {
    $.ajax({
        url: '/users/getDevices',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("authToken") },
        dataType: 'json'
      })
        .done(getDevicesSuccess)
        .fail(accountInfoError);
  
}

function getDevicesSuccess(data, textStatus, jqXHR){
    userEmail = data.userEmail;
    for (let device of data.devices) {
        $("#deviceList").append(`<li class='collection-item ${device.deviceId}-li device-list-li'>
        <div class="detail-buttons">
            <button id='detail-${device.deviceId}' class='waves-effect waves-light btn'>Detail</button>
        </div>&emsp;&emsp; 
        <div class="devices-list-container">
            <div class="list-deviceId"><b>ID: ` + device.deviceId + ` </b></div>       
            <div class="list-apiKey">APIKEY: ${device.apikey}</div>
        </div>
        </li>`);
        
        //Detail buttons click events
        //Display all measurement and plots
        $("#detail-"+device.deviceId).click(function(event) {
            $("#argondata").slideDown();
            showDeviceMeasurements(device.deviceId);
            requestWeeklySummaryData(device.deviceId);
            requestDailySummaryData(device.deviceId);
        });
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

//show all data in table 
function showDeviceMeasurements(deviceId) {
    
    $.ajax({
        url: '/argon/allData',
        type: 'GET',
        data: { 'deviceId': deviceId }, 
        responseType: 'json',
        success: function (data, textStatus, jqXHR) {
            
            //display User Data section
            // $('#argondata').show();
            $('#datasheet-DeviceId').text(deviceId);

            if(data.respondDeviceData.length == 0){
                $("#noAllDataMsg").text("No Data for this Device, Check your Device's status!");
                $("#noAllDataMsg").show();
                $("#ReadingTable").hide();  //hide the data table
                $("#allDataTable").hide();  //hide the data table
                
                //clear all canvas
                $("#weeklyPlot").remove();  
                $("#dailyPlot_bpm").remove(); 
                $("#dailyPlot_satOxygen").remove();  
                //show the dataNotAvailable picture instead
                // $('.data-not-available').show();
            }else{
                $("#noAllDataMsg").hide();
                // $('.data-not-available').hide();    //otherwise, hide the dataNotAvailable picture
                //show all data in table
                $('#ReadingTable').html("");
                for(let i = 0; i < data.respondDeviceData.length; i++){
                    $('#ReadingTable').append(
                        `<tr>
                        <td class="bpm_data">${data.respondDeviceData[i].avgBPM} BPM</td>
                        <td class="satOxy_data">${data.respondDeviceData[i].satOxygen} %</td>
                        <td class="data-readingTime">${moment(data.respondDeviceData[i].takenTime).format('lll')}</td>
                        </tr>`
                    );
                }
                $("#allDataTable").show(); //show the data table backup
                $("#ReadingTable").show(); //show the data table backup
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
             var response = JSON.parse(jqXHR.responseText);
             $("#error").html("Error: " + response.message);
             $("#error").show();
        }
    });
}

//request Weekly Summary Data
function requestWeeklySummaryData(deviceId){
    $.ajax({
        url: '/argon/weeklySummaryData', 
        type: 'GET',
        data: { 'deviceId': deviceId }, 
        responseType: 'json'
    })
    .done(plotWeeklySummary)
    .fail(function(jqXHR, textStatus, errorThrown) {
        let response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
    });
}

//request Daily Data
function requestDailySummaryData(deviceId){

    $.ajax({
        url: '/argon/allData',  //working perfect for this endpoint (some timezone error for "dailySummaryData" endpoint), so I left it this way
        type: 'GET',
        data: { 'deviceId': deviceId}, 
        responseType: 'json'
    })
    .done(plotDailySummary)
    .fail(function(jqXHR, textStatus, errorThrown) {
        let response = JSON.parse(jqXHR.responseText);
        $("#error").html("Error: " + response.message);
        $("#error").show();
    });
}

//Create and show the weekly summary plot
function plotWeeklySummary(respondData, textStatus, jqXHR){
    let allDataArray = respondData.respondDeviceData;
    let avgHeartRate = 0.0;
    let maxHeartRate = 0;
    let minHeartRate = 1000;
    let sum = 0;

    //Delete/CLEAR the old canvas
    $("#weeklyPlot").remove();  

    //No data in the past 7 days
    if(allDataArray.length == 0){
        $('#no-data-in-7days').text("No Data In The Past 7 Days");
        $('#no-data-in-7days').show();
    }
    else{
        $("#no-data-in-7days").text("");
        $('#no-data-in-7days').hide();
        //Get the Max and Min, and the sum within 7 days
        for(let i = 0; i < allDataArray.length; i++){
            sum += allDataArray[i].avgBPM;
            if(allDataArray[i].avgBPM >= maxHeartRate){
                maxHeartRate = allDataArray[i].avgBPM;
            }
            if(allDataArray[i].avgBPM < minHeartRate){
                minHeartRate = allDataArray[i].avgBPM;
            }
        }

        if(minHeartRate == 1000){   //meaning no data
            minHeartRate = 0;       //reset min to 0
        }

        //avg. heart rate within 7 days
        avgHeartRate = (sum / allDataArray.length).toFixed(2); //2 digits

        // console.log(maxHeartRate, minHeartRate, avgHeartRate);

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
                responsive: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            beginAtZero: true
                        } 
                    }]
                },
                animation: {    //Display data on the chart
                    duration: 1,
                    onComplete: function () {
                        var chartInstance = this.chart,
                            ctx = chartInstance.ctx;
                        ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
            
                        this.data.datasets.forEach(function (dataset, i) {
                            var meta = chartInstance.controller.getDatasetMeta(i);
                            meta.data.forEach(function (bar, index) {
                                var data = dataset.data[index];                            
                                ctx.fillText(data, bar._model.x, bar._model.y + 20);
                            });
                        });
                    }
                }
            }
        });

    }   
}

//Create and show the daily summary plot
function plotDailySummary(respondData, textStatus, jqXHR){
    let respondDeviceData = respondData.respondDeviceData;
    //Fix the input format for using moment()
    let selectedDate = $("#my_date_picker").val()+'';
    let startTime = selectedDate + " " + $("#dailyStartTime").val();
    let endTime = selectedDate + " " + $("#dailyEndTime").val();
    let hoursDiff = moment(endTime).diff(moment(startTime), 'hours');
    
    //array for plots
    let labels = [];
    let bpmDatas = [];
    let satOxygenDatas = [];

    //Delete/CLEAR the old canvas
    $("#dailyPlot_bpm").remove(); 
    $("#dailyPlot_satOxygen").remove();  

    //Get all Today's ArgonData recorded data with
    //user defined time of day range
    for(let i = 0; i < respondDeviceData.length; i++){
        if(moment(selectedDate).isSame(moment(respondDeviceData[i].takenTime), 'day')    
            && moment(respondDeviceData[i].takenTime).diff(moment(startTime), 'hours') >= 0
            && moment(respondDeviceData[i].takenTime).diff(moment(startTime), 'minutes') >= 0
            && moment(endTime).diff(moment(respondDeviceData[i].takenTime), 'hours') <= hoursDiff
            && moment(endTime).diff(moment(respondDeviceData[i].takenTime), 'hours') >= 0
            && moment(endTime).diff(moment(respondDeviceData[i].takenTime), 'minutes') >= 0){

                labels.push(moment(respondDeviceData[i].takenTime).format('LT'));
                bpmDatas.push(respondDeviceData[i].avgBPM);
                satOxygenDatas.push(respondDeviceData[i].satOxygen);
        }
        
    }

    //No data in the selected time ranges
    if(labels.length == 0){
        $('.no-data-in-select-time-range').text("No Data In Selected Date & Time Range, Please Re-Select!");
        $('.no-data-in-select-time-range').show();
        $(".daily-plots-title").hide();
        $("#dailyPlotSeparate").hide();
    }
    else{
        //hide no-data-message
        $(".no-data-in-select-time-range").text("");
        $(".daily-plots-title").show();
        $("#dailyPlotSeparate").show();
        $('.no-data-in-select-time-range').hide();
    

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
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
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
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
                        }
                    }]
                }
            }
        });
    }
    
}

function updateDailyPlots(){
    // console.log("hi");
    let deviceId = $('#datasheet-DeviceId').text();
    requestDailySummaryData(deviceId);
}

function refreshData(){
    let deviceId = $('#datasheet-DeviceId').text();
    // console.log($("#my_date_picker").val());
    $( "#my_date_picker" ).datepicker().datepicker("setDate", new Date());  //Default select today
    $('#dailyStartTime').timepicker('setTime', "6:00am");   //default select 6am
    $('#dailyEndTime').timepicker('setTime', "10:00pm");    //default select 10pm
    showDeviceMeasurements(deviceId);
    requestWeeklySummaryData(deviceId);
    requestDailySummaryData(deviceId);
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

function updateDeviceFreq(){
    let selectedFreq = $(".frequency:selected").val();
    let deviceId = $("#datasheet-DeviceId").text();
    console.log(selectedFreq, deviceId);

    //send to device and update
    $.ajax({
        url: '/devices/updateFreq', 
        type: 'POST',
        data: { 'deviceId': deviceId, 'newFrequency': selectedFreq}, 
        responseType: 'json'
    })
    .done( () => {
        $("#updatedMsg").text(`Frequency updated to ${selectedFreq} mins.`);
        $("#updatedMsg").show();
        //3 seconds later, hide the message
        setTimeout(function(){  
            $("#updatedMsg").text("");
            $("#updatedMsg").hide();
        }, 3000);
        console.log("update frequncy successfully!");
    })
    .fail(() => {
        console.log("update frequncy Failed!");
    });
}

function updateDeviceStartTime(){
    let deviceId = $("#datasheet-DeviceId").text();
    let selectedStartTime = $(".changetimeStart:selected").val();

    //send to device and update
    $.ajax({
        url: '/devices/updateStartTime', 
        type: 'POST',
        data: { 'deviceId': deviceId, 'startTime': selectedStartTime}, 
        responseType: 'json'
    })
    .done( () => {
        console.log("Update device's startTime successfully!");
    })
    .fail(() => {
        console.log("Update device's startTime Failed!");
    });
}

function updateDeviceEndTime(){
    let deviceId = $("#datasheet-DeviceId").text();
    let selectedEndTime = $(".changetimeEnd:selected").val();

    //send to device and update
    $.ajax({
        url: '/devices/updateEndTime', 
        type: 'POST',
        data: { 'deviceId': deviceId, 'endTime': selectedEndTime}, 
        responseType: 'json'
    })
    .done( () => {
        console.log("Update device's endTime successfully!");
    })
    .fail(() => {
        console.log("Update device's endTime Failed!");
    });
}

$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("login.html");
    }
    else {
        sendAccountDevicesRequest();
    }

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
    
    $("#refresh_icon").click(refreshData);


    //update Frequency and time of the date
    $("#selectFreq").change(updateDeviceFreq);
    $("#selectTimeRangeStart").change(updateDeviceStartTime);
    $("#selectTimeRangeEnd").change(updateDeviceEndTime);
});