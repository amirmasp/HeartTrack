// This #include statement was automatically added by the Particle IDE.
#include "BPMMonitorSM.h"

//-------------------------------------------------------------------

#include <Wire.h>
#include "MAX30105.h"
#include "BPMMonitorSM.h"

//-------------------------------------------------------------------

using namespace std;

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

//-------------------------------------------------------------------

void setup() {
   Serial.begin(115200);
   pinMode(D7, OUTPUT);
   Serial.println("\n------------------------------------------------------------------");
   Serial.print("\n\t     ECE 413/513 Project Milestone and Demo \n\n");
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
    Particle.subscribe("hook-response/bpm", myHandler, MY_DEVICES);
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
}
