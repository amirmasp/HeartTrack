// This #include statement was automatically added by the Particle IDE.
#include "BPMMonitorSM.h"

//-------------------------------------------------------------------

#include <Wire.h>
#include "MAX30105.h"
#include "BPMMonitorSM.h"

//-------------------------------------------------------------------

using namespace std;

LEDStatus blinkGreen(RGB_COLOR_GREEN, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);

//-------------------------------------------------------------------

#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
unsigned long lastSync = millis();

//-------------------------------------------------------------------

// Sensors and Outputs

//Variables and objects
MAX30105 heartSensor = MAX30105();

//-------------------------------------------------------------------

// State Machines

BPMMonitorSM bpmSM (heartSensor);


//-------------------------------------------------------------------

// State machine scheduler

bool executeStateMachines = false;

void simpleScheduler() {
   executeStateMachines = true;
}

Timer schedulerTimer(10, simpleScheduler);

// int frequency;
// int startTime;
// int endTime;

//-------------------------------------------------------------------

void setup() {
   Serial.begin(115200);
   pinMode(D7, OUTPUT);//BLUE LED
   pinMode(D6, OUTPUT); //YELLOW LED
   pinMode(D5, OUTPUT); //GREEN LED
   Time.zone(-7);
   Serial.println("\n------------------------------------------------------------------");
   Serial.print("\n\t     ECE 413/513 Project Final Demo \n\n");
   Serial.print("------------------------------------------------------------------\n");

   // Sensor Initialization:  default I2C port, 400kHz speed
   if (!heartSensor.begin(Wire, I2C_SPEED_FAST)) {
      Serial.println("MAX30105 was not found. Please check wiring/power.");
      while (1);
   }

   // Configure sensor with default settings
   heartSensor.setup(); 
  
   // Turn Red LED to low to indicate sensor is running
   heartSensor.setPulseAmplitudeRed(0x0A);
  
   // Turn off Green LED
   heartSensor.setPulseAmplitudeGreen(0); 
  
   // Starts the state machine scheduler timer.
   schedulerTimer.start();
   
   // Setup webhook subscribe
    Particle.subscribe("hook-response/ECE513ProjectBPM", myHandler, MY_DEVICES);
    
    //Setup Particle Functions
    Particle.function("updateFrequency", updateDeviceFrequency);
    Particle.function("updateStartTime", updateStartTime);
    Particle.function("updateEndTime", updateEndTime);
    
}

//-------------------------------------------------------------------

void loop() {
   // Request time synchronization from the Particle Cloud once per day
   if (millis() - lastSync > ONE_DAY_MILLIS) {
      Particle.syncTime();
      lastSync = millis();
   }

   if (executeStateMachines) {
      bpmSM.execute();
      executeStateMachines = false;
   }
}

//-------------------------------------------------------------------

// When obtain response from the publish
void myHandler(const char *event, const char *data) {
  // Formatting output
  String output = String::format("\nResponse from Post:\n  %s\n", data);
  // Log to serial console
  Serial.println(output);
  
//   digitalWrite(D5, HIGH);     //Turn on green LED once data was recorded in the database
  blinkGreen.setActive(true);
  delay(2000);
  blinkGreen.setActive(false);
//   digitalWrite(D5, LOW);    //Turn on green LED
}
//-------------------------------------------------------------------

//-------------------------Update Device Frequency----------------------
int updateDeviceFrequency(String command){
    if(command == "5"){
        bpmSM.currentFrequency = 5;
        bpmSM.updatedFreqCheck = 1;
        Serial.print("\n\t     The Frequency of Measurement changed to 5 mins \n\n");
        return 5;
    }
    else if(command == "10"){
        bpmSM.currentFrequency = 10;
        bpmSM.updatedFreqCheck = 1;
        Serial.print("\n\t     The Frequency of Measurement changed to 10 mins \n\n");
        return 10;
    }
    else if(command == "15"){
        bpmSM.currentFrequency = 15;
        bpmSM.updatedFreqCheck = 1;
        Serial.print("\n\t     The Frequency of Measurement changed to 15 mins \n\n");
        return 15;
    }
    else if(command == "30"){
        bpmSM.currentFrequency = 30;
        bpmSM.updatedFreqCheck = 1;
        Serial.print("\n\t     The Frequency of Measurement changed to 30 mins \n\n");
        return 30;
    }
    else if(command == "60"){
        bpmSM.currentFrequency = 60;
        bpmSM.updatedFreqCheck = 1;
        Serial.print("\n\t     The Frequency of Measurement changed to 1 hour \n\n");
        return 60;
    }
    return -1;
}
//-------------------------Update Device Frequency----------------------

//-------------------------Update Device Start Time----------------------
int updateStartTime(String command){
    if(command == "6"){
        bpmSM.startTime = 6;
        Serial.print("\n\t     The StartTime of Measurement changed to 6:00 AM \n\n");
        return 6;
    }
    else if(command == "7"){
        bpmSM.startTime = 7;
        Serial.print("\n\t     The StartTime of Measurement changed to 7:00 AM \n\n");
        return 7;
    }
    else if(command == "8"){
        bpmSM.startTime = 8;
        Serial.print("\n\t     The StartTime of Measurement changed to 8:00 AM \n\n");
        return 8;
    }
    else if(command == "9"){
        bpmSM.startTime = 9;
        Serial.print("\n\t     The StartTime of Measurement changed to 9:00 AM \n\n");
        return 9;
    }
    else if(command == "10"){
        bpmSM.startTime = 10;
        Serial.print("\n\t     The StartTime of Measurement changed to 10:00 AM \n\n");
        return 10;
    }
    else if(command == "11"){
        bpmSM.startTime = 11;
        Serial.print("\n\t     The StartTime of Measurement changed to 11:00 AM \n\n");
        return 11;
    }
    else if(command == "12"){
        bpmSM.startTime = 12;
        Serial.print("\n\t     The StartTime of Measurement changed to 12:00 PM \n\n");
        return 12;
    }
    else if(command == "13"){
        bpmSM.startTime = 13;
        Serial.print("\n\t     The StartTime of Measurement changed to 1:00 PM \n\n");
        return 13;
    }
    else if(command == "14"){
        bpmSM.startTime = 14;
        Serial.print("\n\t     The StartTime of Measurement changed to 2:00 PM \n\n");
        return 14;
    }
    else if(command == "15"){
        bpmSM.startTime = 15;
        Serial.print("\n\t     The StartTime of Measurement changed to 3:00 PM \n\n");
        return 15;
    }
    else if(command == "16"){
        bpmSM.startTime = 16;
        Serial.print("\n\t     The StartTime of Measurement changed to 4:00 PM \n\n");
        return 16;
    }
    else if(command == "17"){
        bpmSM.startTime = 17;
        Serial.print("\n\t     The StartTime of Measurement changed to 5:00 PM \n\n");
        return 17;
    }
    else if(command == "18"){
        bpmSM.startTime = 18;
        Serial.print("\n\t     The StartTime of Measurement changed to 6:00 PM \n\n");
        return 18;
    }
    else if(command == "19"){
        bpmSM.startTime = 19;
        Serial.print("\n\t     The StartTime of Measurement changed to 7:00 PM \n\n");
        return 19;
    }
    else if(command == "20"){
        bpmSM.startTime = 20;
        Serial.print("\n\t     The StartTime of Measurement changed to 8:00 PM \n\n");
        return 20;
    }
    else if(command == "21"){
        bpmSM.startTime = 21;
        Serial.print("\n\t     The StartTime of Measurement changed to 9:00 PM \n\n");
        return 21;
    }
    else if(command == "22"){
        bpmSM.startTime = 22;
        Serial.print("\n\t     The StartTime of Measurement changed to 10:00 PM \n\n");
        return 22;
    }
    return -1;
}
//-------------------------Update Device Start Time----------------------

//-------------------------Update Device End Time----------------------
int updateEndTime(String command){
    if(command == "6"){
        bpmSM.endTime = 6;
        Serial.print("\n\t     The EndTime of Measurement changed to 6:00 AM \n\n");
        return 6;
    }
    else if(command == "7"){
        bpmSM.endTime = 7;
        Serial.print("\n\t     The EndTime of Measurement changed to 7:00 AM \n\n");
        return 7;
    }
    else if(command == "8"){
        bpmSM.endTime = 8;
        Serial.print("\n\t     The EndTime of Measurement changed to 8:00 AM \n\n");
        return 8;
    }
    else if(command == "9"){
        bpmSM.endTime = 9;
        Serial.print("\n\t     The EndTime of Measurement changed to 9:00 AM \n\n");
        return 9;
    }
    else if(command == "10"){
        bpmSM.endTime = 10;
        Serial.print("\n\t     The EndTime of Measurement changed to 10:00 AM \n\n");
        return 10;
    }
    else if(command == "11"){
        bpmSM.endTime = 11;
        Serial.print("\n\t     The EndTime of Measurement changed to 11:00 AM \n\n");
        return 11;
    }
    else if(command == "12"){
        bpmSM.endTime = 12;
        Serial.print("\n\t     The EndTime of Measurement changed to 12:00 PM \n\n");
        return 12;
    }
    else if(command == "13"){
        bpmSM.endTime = 13;
        Serial.print("\n\t     The EndTime of Measurement changed to 1:00 PM \n\n");
        return 13;
    }
    else if(command == "14"){
        bpmSM.endTime = 14;
        Serial.print("\n\t     The EndTime of Measurement changed to 2:00 PM \n\n");
        return 14;
    }
    else if(command == "15"){
        bpmSM.endTime = 15;
        Serial.print("\n\t     The EndTime of Measurement changed to 3:00 PM \n\n");
        return 15;
    }
    else if(command == "16"){
        bpmSM.endTime = 16;
        Serial.print("\n\t     The EndTime of Measurement changed to 4:00 PM \n\n");
        return 16;
    }
    else if(command == "17"){
        bpmSM.endTime = 17;
        Serial.print("\n\t     The EndTime of Measurement changed to 5:00 PM \n\n");
        return 17;
    }
    else if(command == "18"){
        bpmSM.endTime = 18;
        Serial.print("\n\t     The EndTime of Measurement changed to 6:00 PM \n\n");
        return 18;
    }
    else if(command == "19"){
        bpmSM.endTime = 19;
        Serial.print("\n\t     The EndTime of Measurement changed to 7:00 PM \n\n");
        return 19;
    }
    else if(command == "20"){
        bpmSM.endTime = 20;
        Serial.print("\n\t     The EndTime of Measurement changed to 8:00 PM \n\n");
        return 20;
    }
    else if(command == "21"){
        bpmSM.endTime = 21;
        Serial.print("\n\t     The EndTime of Measurement changed to 9:00 PM \n\n");
        return 21;
    }
    else if(command == "22"){
        bpmSM.endTime = 22;
        Serial.print("\n\t     The EndTime of Measurement changed to 10:00 PM \n\n");
        return 22;
    }
    return -1;
}
//-------------------------Update Device End Time----------------------