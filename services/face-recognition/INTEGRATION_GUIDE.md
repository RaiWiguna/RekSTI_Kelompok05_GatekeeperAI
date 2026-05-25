# Face Recognition Integration Guide

## Overview

Integrasi Teachable Machine model dengan Gatekeeper untuk deteksi wajah di cloud. Sistem terdiri dari:

1. **Face Recognition Service** (Python) - Menjalankan model TensorFlow untuk inference
2. **IoT Gateway** (NestJS) - Bridge antara IoT device dan face recognition service
3. **IoT Device** (Arduino/ESP32) - Capture image dan kirim ke gateway

## Setup

### 1. Export Model dari Teachable Machine

1. Buka [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Buat project Image Classification
3. Training model dengan dataset wajah (recognized vs tidak recognized)
4. Export model:
   - Pilih "TensorFlow" 
   - Download model (pilih Keras atau TFLite format)
   - Extract file yang sudah di-download

### 2. Setup Face Recognition Service

#### Prerequisites
- Python 3.11+
- pip

#### Installation

```bash
cd services/face-recognition

# Install dependencies
pip install -r requirements.txt  # atau gunakan uv/poetry
```

#### Environment Variables

Buat file `.env` di `services/face-recognition/`:

```env
# Model path (support .tflite, .h5, .keras, dan SavedModel format)
MODEL_PATH=./models/model.h5

# Server port
PORT=8000

# untuk development
DEBUG=true
```

**Supported Model Formats:**
- `.tflite` - TensorFlow Lite (recommended untuk IoT, lightweight)
- `.h5` - Keras format (classic)
- `.keras` - Keras format (newer, Keras 3+)
- SavedModel directory - TensorFlow SavedModel format

#### Menjalankan Service

```bash
# Development
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Service akan available di `http://localhost:8000`

### 3. Setup IoT Gateway

#### Installation

```bash
cd services/iot-gateway

# Install dependencies
pnpm install
```

#### Environment Variables

Buat file `.env.local` di `services/iot-gateway/`:

```env
# Serial port untuk ESP32 (Windows: COM5, Linux: /dev/ttyUSB0, macOS: /dev/tty.usbserial-*)
ESP32_SERIAL_PORT=/dev/ttyUSB0

# Port untuk gateway API
IOT_GATEWAY_PORT=3002

# Face Recognition Service URL
FACE_RECOGNITION_URL=http://localhost:8000
```

#### Menjalankan Service

```bash
# Development
pnpm dev

# Production build
pnpm build
node dist/main.js
```

Gateway akan available di `http://localhost:3002/v1`

## API Documentation

### Face Recognition Service

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "service": "face-recognition",
  "status": "ok",
  "model_loaded": true
}
```

#### Detect Face (File Upload)
```bash
POST /inference/detect
Content-Type: multipart/form-data

Form Data:
- image: <binary image file>
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "face_detected",
      "confidence": 0.95
    }
  ],
  "timestamp": "2026-05-25T10:30:00.000Z"
}
```

#### Detect Face (Base64)
```bash
POST /inference/detect-base64
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Reload Model
```bash
POST /model/reload
```

**Response:**
```json
{
  "success": true,
  "message": "Model reloaded successfully"
}
```

### IoT Gateway

#### Detection Endpoint
```bash
POST /v1/detection/detect
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "auto_unlock": true
}
```

**Response (Face Detected):**
```json
{
  "ok": true,
  "detection": {
    "success": true,
    "detections": [
      {
        "class": "face_detected",
        "confidence": 0.95
      }
    ]
  },
  "action": "unlocked"
}
```

**Response (No Face):**
```json
{
  "ok": true,
  "detection": {
    "success": true,
    "detections": []
  }
}
```

#### Health Check
```bash
POST /v1/detection/health
```

**Response:**
```json
{
  "ok": true,
  "face_recognition": "ok",
  "serial": "ok"
}
```

#### Gateway Status
```bash
GET /v1/gateway/status
```

**Response:**
```json
{
  "port": "/dev/ttyUSB0",
  "connected": true,
  "lock": "LOCKED",
  "door": "DOOR_CLOSED",
  "lastEventAt": "2026-05-25T10:30:00.000Z",
  "lastEvent": "DOOR_CLOSED"
}
```

#### Lock/Unlock
```bash
POST /v1/gateway/unlock
POST /v1/gateway/lock
```

## IoT Device Integration

### Arduino/ESP32 Setup

Di gatekeeper.ino, tambahkan kemampuan untuk capture image dan kirim ke gateway:

```cpp
// Pseudo-code untuk ESP32 dengan camera module
#include <esp_camera.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Camera configuration
camera_config_t config;
config.ledc_channel = LEDC_CHANNEL_0;
config.ledc_timer = LEDC_TIMER_0;
config.pin_d0 = Y2_GPIO_NUM;
config.pin_d1 = Y3_GPIO_NUM;
// ... configure all pins

esp_err_t err = esp_camera_init(&config);

// Capture and send to gateway
uint8_t *fb_buf = NULL;
size_t fb_len = 0;
camera_fb_t *fb = esp_camera_fb_get();
fb_buf = fb->buf;
fb_len = fb->len;

// Base64 encode dan kirim ke gateway
String payload = base64_encode(fb_buf, fb_len);
HTTPClient http;
http.begin("http://gateway_ip:3002/v1/detection/detect");
http.addHeader("Content-Type", "application/json");
String json = "{\"image\":\"" + payload + "\",\"auto_unlock\":true}";
http.POST(json);
```

## Usage Examples

### Python Client

```python
import requests
import base64

# Read image
with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# Send to gateway
response = requests.post(
    "http://localhost:3002/v1/detection/detect",
    json={
        "image": image_data,
        "auto_unlock": True
    }
)

print(response.json())
```

### cURL

```bash
# Detect face from base64
curl -X POST http://localhost:3002/v1/detection/detect \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image",
    "auto_unlock": true
  }'

# Health check
curl -X POST http://localhost:3002/v1/detection/health
```

### Node.js Client

```javascript
const axios = require('axios');
const fs = require('fs');

async function detectFace() {
  const imageBuffer = fs.readFileSync('image.jpg');
  const base64Image = imageBuffer.toString('base64');
  
  try {
    const response = await axios.post(
      'http://localhost:3002/v1/detection/detect',
      {
        image: base64Image,
        auto_unlock: true
      }
    );
    
    console.log('Detection result:', response.data);
  } catch (error) {
    console.error('Detection failed:', error.message);
  }
}

detectFace();
```

## Model Training Tips

### Teachable Machine Best Practices

1. **Class Organization**
   - Class 1: "face_detected" - Images dengan wajah terdeteksi
   - Class 2: "no_face" - Images tanpa wajah / background

2. **Dataset Quality**
   - Minimal 50-100 images per class
   - Variasi lighting, angle, dan distance
   - Include real-world scenarios

3. **Training**
   - Epoch: 100-200 (default usually works)
   - Batch size: 16-32
   - Training time: 5-15 menit

4. **Model Size & Format**
   - TFLite (`.tflite`): ~5-10MB - recommended untuk IoT, lightweight & fast
   - Keras (`.h5`): ~20-30MB - classic format, widely supported
   - Keras 3 (`.keras`): ~20-30MB - newer format
   - SavedModel: ~20-50MB - TensorFlow native format

## Troubleshooting

### Model tidak load
```
Error: Model not found at ./model.tflite
```
Solution: Pastikan MODEL_PATH environment variable set dengan benar dan file ada.

### Face detection service unreachable
```
Error: Face detection service error
```
Solution: 
1. Pastikan face-recognition service running
2. Check FACE_RECOGNITION_URL di env variables
3. Verify network connectivity

### Serial port connection failed
```
Error: Serial port /dev/ttyUSB0 not connected
```
Solution:
1. Check device sudah connected
2. Verify port name: `ls /dev/tty*` (Linux/macOS) atau Device Manager (Windows)
3. Update ESP32_SERIAL_PORT di env variables

## Performance Optimization

1. **Image Preprocessing**
   - Resize ke 224x224 sebelum inference
   - Normalize pixel values ke [0, 1]
   - JPEG compression untuk reduce bandwidth

2. **Caching**
   - Cache model di memory (sudah diimplementasi)
   - Implement request debouncing di IoT device

3. **Batch Processing**
   - Send multiple frames dalam satu request untuk efficiency

## Security Considerations

1. **API Authentication** (Future)
   - Implement JWT/Bearer token
   - API key based authentication

2. **Encryption**
   - Use HTTPS untuk production
   - Encrypt image transmission

3. **Model Privacy**
   - Store model securely
   - Don't expose model outputs without authorization
