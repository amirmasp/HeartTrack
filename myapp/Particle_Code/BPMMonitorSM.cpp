//-------------------------------------------------------------------

#include "BPMMonitorSM.h"
#include "MAX30105.h"
#include "heartRate.h"
#include <Wire.h>
#include <vector>
#include "spo2_algorithm.h"

//-------------------------------------------------------------------

using namespace std;
    
//-------------------------------------------------------------------

BPMMonitorSM::BPMMonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
   state = BPMMonitorSM::S_Init;
   beatsPerMinute = 0.0;
   lastBeat = 0;
   Readyforgdata = false;
   readingTimer = 0;

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
      
         if (readingTimer == 0) {
         Serial.println("\n\n**********   The system is now in a Wait State  \t**********"); //Indicating the beiging of a wait state
         }
         
         tick = 0;
         readingTimer = readingTimer + 10;
         digitalWrite(D7, LOW); //Turn off the LED that indicates a required reading
         
         
         if (readingTimer == 10000) {   //check if the timer matched the desired cycle, time measured in milliseconds (1 minute = 60 seconds = 60 × 1000 milliseconds = 60,000 ms)
            readingTimer = 0;
            Readyforgdata = true;   //flag to for entering reading state 
            state = BPMMonitorSM::S_ReadSensor;
         }
         else {
             
             state = BPMMonitorSM::S_Init;
         }
         break;
            
            
            
      case BPMMonitorSM::S_ReadSensor:
      
         digitalWrite(D7, HIGH); //Turn on the LED that indicates a required reading
         
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
               Serial.println("No finger deteced.");
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

                if ( spo2 > 100 || spo2 < 0)  //if the data is invalid then take new measurments
                { 
                  state = BPMMonitorSM::S_ReadSensor;
                }
               
               else  //if the data is valid then print the data in the serial and then transition to report state
               {  
                  Serial.print("\nSuccessful reading: HR=");
                  Serial.print(heartRate, DEC);
                  Serial.print(", spo2=");
                  Serial.println(spo2, DEC);
               
                  bpmHistory.push_back(heartRate);
                  spo2History.push_back(spo2);
                  
                  state = BPMMonitorSM::S_Report;
               }
            }
         }
         
         break;
         
        
      case BPMMonitorSM::S_Report:
      
         BPMvalue = bpmHistory.at(0);   //Reading the stored value of BPM;
         spo2value = spo2History.at(0); //Reading the stored value of spo2;
               
         data = String::format("{\"satOxygen\": \"%f\", \"avgBPM\": \"%f\" }", spo2value, BPMvalue);    //saving data in JSON format before transmit them to the server 
         Particle.publish("bpm", data, PRIVATE);    //publish data to the webhook
         bpmHistory.clear();    //remove old data
         spo2History.clear();   //remove old data
        
         state = BPMMonitorSM::S_Init;  //return back into inital state
         break;
   }
}

//-------------------------------------------------------------------

float BPMMonitorSM::getBPM() {
   return beatsPerMinute;
}

//-------------------------------------------------------------------
