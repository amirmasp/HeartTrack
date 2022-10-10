//-------------------------------------------------------------------

#include "BPMMonitorSM.h"
#include "MAX30105.h"
#include "heartRate.h"
#include <Wire.h>
#include <vector>
#include "spo2_algorithm.h"

//-------------------------------------------------------------------

using namespace std;

// //Defining and using a LED status
LEDStatus blinkBlue(RGB_COLOR_BLUE, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus blinkYellow(RGB_COLOR_YELLOW, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);

//-------------------------------------------------------------------

BPMMonitorSM::BPMMonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
   state = BPMMonitorSM::S_Init;
   beatsPerMinute = 0.0;
   lastBeat = 0;
   Readyforgdata = false;
   readingTimer = 0;
   //added
    noWiFiTick = 0;
    fiveMinutesTick = 0;
    frequencyTick = 0;

    currentFrequency = 30; //default in 30 minutes (180000ms * 10)
    startTime = 6;  //default 6:00AM
    endTime = 22;   //default 10:00PM
    updatedFreqCheck = 0;
}

//-------------------------------------------------------------------

void BPMMonitorSM::execute() {
   String data = "";
   long irValue = 0;
   float BPMvalue = 0.0;
   float spo2value = 0.0;
   float bpmMeasurement = 0.0;



   switch (state) {

      case BPMMonitorSM::S_Init:

        //--------------------Checking (ONLY FOR DEBUG) ----------------//
        // Serial.print("\n\n**********   Current Frequncy is:  ");
        // Serial.print(currentFrequency);
        // Serial.print(" mins.    Current Time in hour: ");
        // Serial.print(Time.hour() - 7);  //UTC-7:00
        // Serial.print("\t**********\n**********  StartTime: ");
        // Serial.print(startTime);
        // Serial.print("\t    EndTime: ");
        // Serial.print(endTime);
        // Serial.print("\t**********\t\n\n");
        // delay(1000);
        //--------------------Checking (ONLY FOR DEBUG) ----------------//


         tick = 0;

        if(updatedFreqCheck == 1){  //if frequency has updated, reset the timer tick
            frequencyTick = 0;
            updatedFreqCheck = 0; //and reset signal for future process
        }


        //  digitalWrite(D7, LOW); //Turn off the LED that indicates a required reading
        //  digitalWrite(D6, LOW);     //Turn off yellow LED
         blinkBlue.setActive(false);
         blinkYellow.setActive(false);


         fiveMinutesTick = 0;   //reset the five minutes tick


            if(!WiFi.ready() && noWiFiTick <= 8640000){ //8640000ms * 10ms (state execute time) == 24 hours
                // Serial.print("\n\n**********   The system is not connected to WIFI.  \t**********\n\n");
                // digitalWrite(D6, HIGH);     //Flash RGB yellow
                blinkYellow.setActive(true);
                noWiFiTick++;
                frequencyTick = 0;  //reset
                state = BPMMonitorSM::S_Init;
            }else{      //check again after 24 hours

                noWiFiTick = 0;     //reset the timer for checking wifi connection

                if(!WiFi.ready()){  //if the WIFI is still not back on in 24 hours, remain in initial state
                    // Serial.print("\n\n**********   The WIFI is still not back on in 24 hours.  \t**********\n\n");
                    // digitalWrite(D6, HIGH);     //Flash RGB yellow
                    blinkYellow.setActive(true);
                    frequencyTick = 0;  //reset
                    state = BPMMonitorSM::S_Init;
                }else{  //WiFi is connected
                    // digitalWrite(D6, LOW);     //Turn off yellow LED
                    blinkYellow.setActive(false);
                    //if there some data has not been sent
                    if(bpmHistory.size() > 0 && spo2History.size() > 0){
                        state = BPMMonitorSM::S_Report;
                    }
                    else{   //read new data

                        //check to see if current time is in the required time period
                        if( (Time.hour() >= startTime) && (Time.hour() <= endTime) ){  //OK to continue
                            frequencyTick++;   //count the frequency timer

                            //Then begin the frequncy to ask user to take measurements
                            //frequencyTick: default in 30 minutes (180000ms * 10)
                            //ONLY FOR TESTING: (500ms * 10) = 5 seconds
                            if(frequencyTick == (currentFrequency * 60 * 100)){ // EX: (30 * 60 * 100) = 180000ms * 10 = 30 minutes  //currentFrequency * 60 * 100
                                frequencyTick = 0;  //  reset timer
                                Readyforgdata = true;   //flag to for entering reading state
                                state = BPMMonitorSM::S_ReadSensor;
                            }else if(frequencyTick < (currentFrequency * 60 * 100) ){ // EX: (30 * 60 * 100) = 180000ms * 10 = 30 minutes  //currentFrequency * 60 * 100
                                state = BPMMonitorSM::S_Init;
                                //---------------Checking Value (DEBUG ONLY)--------------//
                                // Serial.print("\n\n**********   frequencyTick:   ");
                                // Serial.print(frequencyTick);
                                // Serial.print("\t**********\n\n");
                                //---------------Checking Value (DEBUG ONLY)--------------//
                            }
                        }else{
                            frequencyTick = 0;  //reset
                            Serial.print("\n\n**********   The system is not going to take measurements right now.  \t**********\n\n");
                            state = BPMMonitorSM::S_Init;
                        }


                    }
                }

            }

         break;



      case BPMMonitorSM::S_ReadSensor:

        //  digitalWrite(D7, HIGH); //Turn on the LED that indicates a required reading
         blinkBlue.setActive(true);

         if (Readyforgdata == true)
            {
                Serial.print("\n\n**********   The system is now ready for new data \t**********\n\n");
                Readyforgdata = false;
            }


         irValue = heartSensor.getIR();

         if (irValue < 5000) { // Ensuring a finger has been detected by the sensor
            tick++;

            if (tick == 50) {
               tick = 0;
               Serial.println("No finger detected.");

            }
            if(fiveMinutesTick < 30000){ //Default: 30000ms * 10 = 5 minutues //ONLY FOR TESTING: MAKE THIS # TO 5 SECONDS (500ms * 10) = 5 SECONDS
                fiveMinutesTick++;
                if(fiveMinutesTick == 30000){   //Default: 30000ms * 10 = 5 minutues //ONLY FOR TESTING: MAKE THIS # TO 5 SECONDS (500ms * 10) = 5 SECONDS
                    fiveMinutesTick = 0;
                    // digitalWrite(D7, LOW); //Turn off the LED that indicates a required reading
                    blinkBlue.setActive(false);
                    state = BPMMonitorSM::S_Init; // back to initial state
                }
            }

         }


         else if (checkForBeat(irValue) == true)  {

            long delta = millis() - lastBeat;
            lastBeat = millis();
            bpmMeasurement = 60 / (delta / 1000.0); //calculate the new bpm

            if (bpmMeasurement > 30 ) {     // if the heart rate is valid then start calculating spo2

               beatsPerMinute = bpmMeasurement;
                 bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

                  for (byte i = 0 ; i < bufferLength ; i++) //read the first 100 samples, and determine the signal range
                  {
                    redBuffer[i] = heartSensor.getRed();
                    irBuffer[i] = heartSensor.getIR();
                  }

                //After gathering new samples calculate HR and SP02
                maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

                if ( (spo2 >= 30 && spo2 <= 100) && (heartRate >= 30 && heartRate <= 200))  //if the data is valid then print the data in the serial and then transition to report state
                {
                  Serial.print("\nSuccessful reading: HR=");
                  Serial.print(heartRate, DEC);
                  Serial.print(", spo2=");
                  Serial.println(spo2, DEC);

                  bpmHistory.push_back(heartRate);
                  spo2History.push_back(spo2);

                  //if the device is connected to with WIFI, ready to report data
                  if(WiFi.ready()){
                      state = BPMMonitorSM::S_Report;
                  }
                  else{ //otherwise go back to the initial state and store the data in 24 hours
                        blinkYellow.setActive(true);
                      state = BPMMonitorSM::S_Init;
                  }
                }

               else  //if the data is invalid then take new measurments
               {

                  state = BPMMonitorSM::S_ReadSensor;
               }
            }
         }

         break;


      case BPMMonitorSM::S_Report:

         BPMvalue = bpmHistory.at(0);   //Reading the stored value of BPM;
         spo2value = spo2History.at(0); //Reading the stored value of spo2;

         data = String::format("{\"satOxygen\": \"%f\", \"avgBPM\": \"%f\" }", spo2value, BPMvalue);    //saving data in JSON format before transmit them to the server
         Particle.publish("ECE513ProjectBPM", data, PRIVATE);    //publish data to the webhook
         bpmHistory.clear();    //remove old data
         spo2History.clear();   //remove old data

         frequencyTick = 0;  //  reset timer
         state = BPMMonitorSM::S_Init;  //return back into inital state
         break;
   }
}

//-------------------------------------------------------------------

float BPMMonitorSM::getBPM() {
   return beatsPerMinute;
}

//-------------------------------------------------------------------
