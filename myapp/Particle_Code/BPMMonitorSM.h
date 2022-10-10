//-------------------------------------------------------------------

#ifndef BPMMonitorSM_H
#define BPMMonitorSM_H

//-------------------------------------------------------------------

#include <vector>
#include <Wire.h>
#include <time.h>
#include "MAX30105.h"

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

class BPMMonitorSM {
   enum State { S_Init, S_ReadSensor, S_Report};

private:
   State state;
   long lastBeat;
   int tick;
   float beatsPerMinute;
   MAX30105& heartSensor;
   vector<float> bpmHistory;
   vector<float> spo2History;
   bool Readyforgdata; 
   int readingTimer;
    
    
    uint32_t irBuffer[100]; //infrared LED sensor data
    uint32_t redBuffer[100];  //red LED sensor data
    
    int32_t bufferLength; //data length
    int32_t spo2; //SPO2 value
    int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
    int32_t heartRate; //heart rate value
    int8_t validHeartRate; //indicator to show if the heart rate calculation is valid
    
    
public:
   BPMMonitorSM(MAX30105& mySensor);  
   void execute();
   float getBPM();
};

//-------------------------------------------------------------------

#endif
