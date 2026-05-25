/*
 * Gatekeeper IoT Device with Camera Face Recognition Integration
 * 
 * Hardware Requirements:
 * - ESP32 with OV2640 camera module (e.g., ESP32-CAM)
 * - Relay module for door lock control
 * - Reed sensor for door status
 * 
 * This code integrates with:
 * - IoT Gateway (NestJS) for relay/control
 * - Face Recognition Service (Python) for AI inference
 * 
 * Serial Communication Protocol:
 * Command -> ESP32 -> Serial -> Gateway (PC/Raspberry Pi)
 * Image Capture -> ESP32 -> WiFi HTTP -> Face Recognition Service
 * Face Result -> Face Recognition Service -> HTTP Response -> Gateway -> ESP32 -> Relay Control
 */

#include <esp_camera.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <base64.h>
#include <SPIFFS.h>

// ========== CONFIGURATION ==========

// WiFi
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// Face Recognition Service
const char* FR_SERVICE_URL = "http://192.168.1.100:8000";  // Adjust IP address

// IoT Gateway
const char* IOT_GATEWAY_URL = "http://192.168.1.100:3002/v1/gateway";

// Camera pins (ESP32-CAM)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Control pins
const int PIN_RELAY      = 12;    // GPIO 12 → relay IN
const int PIN_REED       = 13;    // GPIO 13 → reed sensor
const bool RELAY_ACTIVE_LOW = true;

// Timing
const unsigned long CAPTURE_INTERVAL_MS = 5000;  // Capture every 5 seconds
const unsigned long DETECTION_TIMEOUT_MS = 15000; // Timeout for face detection
const unsigned long UNLOCK_TIMEOUT_MS = 8000;    // Unlock duration

// ========== STATE MANAGEMENT ==========

enum LockState  { LOCKED_STATE, UNLOCKED_STATE };
enum DoorState  { DOOR_CLOSED_STATE, DOOR_OPENED_STATE };
enum CameraState { CAMERA_IDLE, CAMERA_CAPTURING, CAMERA_READY };

LockState lockState = LOCKED_STATE;
DoorState doorState = DOOR_CLOSED_STATE;
CameraState cameraState = CAMERA_IDLE;

unsigned long lastCaptureMs = 0;
unsigned long unlockTimestampMs = 0;
int lastReedRaw = -1;
unsigned long lastReedChangeMs = 0;

// ========== HELPER FUNCTIONS ==========

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;  // 640x480
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }

  // Camera settings
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 0);
  s->set_contrast(s, 0);
  s->set_saturation(s, 0);
  s->set_special_effect(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_wb_mode(s, 0);
  s->set_expose_ctrl(s, 1);
  s->set_aec_value(s, 300);
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, GAINCEILING_2X);
  s->set_bpc(s, 1);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);
  s->set_dcw(s, 1);
  s->set_colorbar(s, 0);

  Serial.println("Camera initialized successfully");
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void setRelay(bool activate) {
  digitalWrite(PIN_RELAY, RELAY_ACTIVE_LOW ? !activate : activate);
}

void send(const char* msg) {
  Serial.println(msg);
}

void doUnlock() {
  setRelay(true);
  lockState = UNLOCKED_STATE;
  unlockTimestampMs = millis();
  send("UNLOCKED");
}

void doLock() {
  setRelay(false);
  lockState = LOCKED_STATE;
  unlockTimestampMs = 0;
  send("LOCKED");
}

void handleTimeout() {
  if (lockState == UNLOCKED_STATE && millis() - unlockTimestampMs > UNLOCK_TIMEOUT_MS) {
    doLock();
  }
}

void updateDoorState() {
  int reedState = digitalRead(PIN_REED);
  
  if (reedState != lastReedRaw) {
    if (millis() - lastReedChangeMs > 50) {  // Debounce
      lastReedRaw = reedState;
      lastReedChangeMs = millis();
      
      // Assuming: LOW = door closed, HIGH = door opened
      if (reedState == LOW) {
        doorState = DOOR_CLOSED_STATE;
        send("DOOR_CLOSED");
      } else {
        doorState = DOOR_OPENED_STATE;
        send("DOOR_OPENED");
      }
    }
  }
}

// ========== FACE DETECTION ==========

String captureAndEncodeImage() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return "";
  }

  // Encode to base64
  String encoded = base64::encode(fb->buf, fb->len);
  esp_camera_fb_return(fb);
  
  return encoded;
}

bool sendDetectionRequest(String base64Image) {
  HTTPClient http;
  http.setTimeout(DETECTION_TIMEOUT_MS);
  
  String url = String(FR_SERVICE_URL) + "/inference/detect-base64";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  String payload = "{\"image\":\"" + base64Image + "\"}";
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Detection response: " + response);
    
    // Parse response and check if face detected
    // You may want to use ArduinoJson library for this
    if (response.indexOf("face_detected") > 0) {
      http.end();
      return true;
    }
  } else {
    Serial.printf("Detection request failed with code %d\n", httpResponseCode);
  }
  
  http.end();
  return false;
}

void triggerFaceDetection() {
  if (millis() - lastCaptureMs < CAPTURE_INTERVAL_MS) {
    return;
  }
  
  lastCaptureMs = millis();
  
  Serial.println("Capturing image for face detection...");
  String base64Image = captureAndEncodeImage();
  
  if (base64Image.length() == 0) {
    Serial.println("Failed to capture image");
    return;
  }
  
  Serial.println("Sending to face recognition service...");
  if (sendDetectionRequest(base64Image)) {
    Serial.println("Face detected! Unlocking...");
    doUnlock();
  } else {
    Serial.println("No face detected");
  }
}

// ========== SERIAL COMMAND PROCESSING ==========

void processCommand(const String& cmd) {
  if (cmd == "UNLOCK") {
    send("ACK:UNLOCK");
    doUnlock();
  }
  else if (cmd == "LOCK") {
    send("ACK:LOCK");
    doLock();
  }
  else if (cmd == "PING") {
    send("ACK:PONG");
  }
  else if (cmd == "STATUS") {
    String status = String("STATUS:") + 
                   (lockState == LOCKED_STATE ? "LOCKED" : "UNLOCKED") + ":" +
                   (doorState == DOOR_CLOSED_STATE ? "CLOSED" : "OPENED");
    send(status.c_str());
  }
  else if (cmd == "CAPTURE") {
    send("ACK:CAPTURE");
    triggerFaceDetection();
  }
  else if (cmd.startsWith("CONFIG:")) {
    // Can be used to update settings via serial
    send("ACK:CONFIG");
  }
  else {
    send("ERR:UNKNOWN_COMMAND");
  }
}

// ========== MAIN SETUP & LOOP ==========

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("Gatekeeper IoT Device - Face Recognition Integration");
  Serial.println("Initializing...\n");
  
  // Setup pins
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_REED, INPUT_PULLUP);
  
  // Initial state
  doLock();
  
  // Setup camera
  setupCamera();
  
  // Setup WiFi
  setupWiFi();
  
  Serial.println("\nSetup complete!");
  Serial.println("Commands: UNLOCK, LOCK, PING, STATUS, CAPTURE");
}

void loop() {
  // Handle incoming serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      processCommand(cmd);
    }
  }
  
  // Update door state (debounced)
  updateDoorState();
  
  // Check unlock timeout
  handleTimeout();
  
  // Optional: Trigger face detection periodically
  // triggerFaceDetection();
  
  delay(10);
}

/*
 * EXAMPLE SERIAL COMMUNICATION:
 * 
 * PC/Gateway -> Device: CAPTURE
 * Device:                ACK:CAPTURE
 * Device:                [captures image and sends to face recognition service]
 * Face Recognition Service response: {"success": true, "detections": [{"class": "face_detected", "confidence": 0.95}]}
 * Device:                UNLOCKED
 * 
 * PC/Gateway -> Device: STATUS
 * Device:                ACK:PING
 * Device:                STATUS:UNLOCKED:CLOSED
 * 
 * ESP32 detects door opened:
 * Device:                DOOR_OPENED
 * 
 * Unlock timeout (8 seconds passed):
 * Device:                LOCKED
 */
