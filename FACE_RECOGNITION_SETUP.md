# Face Recognition Integration - Quick Start

Integrasi Model Teachable Machine ke IoT + Cloud sudah disetup! Berikut step-by-step untuk menjalankannya.

## 📋 What's Been Implemented

### 1. Face Recognition Service (Python)
- FastAPI backend untuk inference
- Support TensorFlow & TensorFlow Lite models
- REST API endpoints untuk detection

### 2. IoT Gateway (NestJS)  
- Communication bridge antara ESP32 dan Face Recognition Service
- Detection endpoint dengan auto-unlock feature
- Health monitoring

### 3. IoT Device Code (Arduino/ESP32)
- Camera capture & image encoding
- WiFi HTTP client
- Relay control untuk door lock

## 🚀 Quick Setup

### Step 1: Export Model dari Teachable Machine

1. Buka https://teachablemachine.withgoogle.com/
2. Create **Image Classification** project
3. Training dengan 2 class:
   - `face_detected` - images dengan wajah
   - `no_face` - images tanpa wajah / background
4. Export sebagai **TensorFlow**:
   - Download as: **Keras** (`.h5` atau `.keras`) atau **TFLite** (`.tflite`)
   - Keras recommended jika processing di cloud/PC (lebih akurat)
   - TFLite recommended jika processing di IoT device (lebih cepat & ringan)
5. Extract file → ambil model file (`.tflite`, `.h5`, atau `.keras`)

### Step 2: Setup Face Recognition Service

```bash
cd services/face-recognition

# Copy environment template
cp .env.example .env

# Edit .env dan set path ke model
# Contoh untuk Keras (.h5):
# MODEL_PATH=./models/model.h5
# Atau untuk TFLite:
# MODEL_PATH=./models/model.tflite

# Install dependencies
pip install -r requirements.txt

# Run service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Test health check:**
```bash
curl http://localhost:8000/health
# Response: {"service": "face-recognition", "status": "ok", "model_loaded": true}
```

### Step 3: Setup IoT Gateway

```bash
cd services/iot-gateway

# Copy environment template
cp .env.example .env.local

# Edit .env.local dan set:
# ESP32_SERIAL_PORT=/dev/ttyUSB0 (or COM3 on Windows)
# FACE_RECOGNITION_URL=http://localhost:8000

# Install & run
pnpm install
pnpm dev
```

**Test health check:**
```bash
curl -X POST http://localhost:3002/v1/detection/health
# Response: {"ok": true, "face_recognition": "ok", "serial": "ok"}
```

### Step 4: Configure ESP32 Device

Edit `gatekeeper_with_camera.ino`:

```cpp
// WiFi credentials
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// Service URLs (update IP address)
const char* FR_SERVICE_URL = "http://192.168.1.100:8000";
const char* IOT_GATEWAY_URL = "http://192.168.1.100:3002/v1/gateway";
```

Upload ke ESP32-CAM board.

## 🧪 Testing

### Test Face Detection

**Option 1: Send image file**
```bash
curl -X POST http://localhost:3002/v1/detection/detect \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image",
    "auto_unlock": true
  }'
```

**Option 2: Python script**
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
        "auto_unlock": True  # Will auto-unlock if face detected
    }
)

print(response.json())
# Output: {"ok": true, "detection": {...}, "action": "unlocked"}
```

### Test via Serial Commands

Jika ESP32 sudah connected:

```bash
# Test detection from IoT Gateway
echo "CAPTURE" > /dev/ttyUSB0

# Test manual unlock
echo "UNLOCK" > /dev/ttyUSB0

# Check status
echo "STATUS" > /dev/ttyUSB0
# Response: STATUS:LOCKED:CLOSED
```

## 🔄 Complete Flow

```
1. ESP32 mengirim CAPTURE command via serial ke gateway
   ↓
2. Gateway forward ke Face Recognition Service
   ↓
3. Face Recognition Service inference & return hasil
   ↓
4. If face detected:
   - Gateway send UNLOCK command ke ESP32
   - Relay activate → door unlock
   ↓
5. After 8 seconds timeout:
   - ESP32 send LOCK command
   - Door lock kembali
```

## 📁 File Structure

```
services/face-recognition/
├── app/
│   └── main.py                    # FastAPI inference service
├── pyproject.toml                 # Dependencies config
├── requirements.txt               # Python dependencies
├── .env.example                   # Configuration template
└── INTEGRATION_GUIDE.md           # Detailed documentation

services/iot-gateway/
├── src/
│   ├── face-recognition.service.ts    # HTTP client service
│   ├── detection.controller.ts        # Detection endpoints
│   ├── app.module.ts                  # Module config
│   └── ...
├── package.json                   # Dependencies
└── .env.example                   # Configuration template

gatekeeper/
├── gatekeeper.ino                 # Original Arduino code
└── gatekeeper_with_camera.ino     # NEW: ESP32 with camera
```

## ⚙️ Environment Variables

### Face Recognition Service
```env
MODEL_PATH=./model.tflite          # Path to TensorFlow model
PORT=8000                          # Server port
DEBUG=false                        # Debug mode
```

### IoT Gateway
```env
ESP32_SERIAL_PORT=/dev/ttyUSB0     # Serial port
IOT_GATEWAY_PORT=3002              # Gateway port
FACE_RECOGNITION_URL=http://localhost:8000
```

### ESP32 Code
```cpp
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* FR_SERVICE_URL = "http://192.168.1.100:8000";
```

## 📊 API Endpoints

### Face Recognition Service
```
GET  /health                           # Health check
POST /inference/detect                 # Detect face (file upload)
POST /inference/detect-base64          # Detect face (base64)
POST /model/reload                     # Reload model
```

### IoT Gateway
```
POST /v1/detection/detect              # Face detection + optional auto-unlock
POST /v1/detection/health              # Health check
GET  /v1/gateway/status                # Get gateway status
POST /v1/gateway/unlock                # Manual unlock
POST /v1/gateway/lock                  # Manual lock
POST /v1/gateway/ping                  # Ping device
POST /v1/gateway/status/refresh        # Refresh status
```

## 🐛 Troubleshooting

### "Model not loaded"
```
Solusi: 
- Check MODEL_PATH di .env
- Verifikasi file model ada
- Restart service
```

### "Face recognition service unreachable"
```
Solusi:
- Pastikan face-recognition service running
- Check FACE_RECOGNITION_URL di env
- Test: curl http://localhost:8000/health
```

### "Serial port not connected"
```
Solusi:
- Check device sudah connected
- List port: ls /dev/tty* (Linux/macOS)
- Update ESP32_SERIAL_PORT di .env.local
```

### "WiFi connection failed on ESP32"
```
Solusi:
- Verifikasi SSID dan password
- Check WiFi strength
- Update firmware ESP32
```

## 🔐 Security Notes

Untuk production, implementasi:
- [ ] HTTPS/TLS untuk image transmission
- [ ] API authentication (JWT/API key)
- [ ] Rate limiting
- [ ] Encrypt model files
- [ ] Secure credential storage

## 📝 Next Steps

1. ✅ Export & test model dari Teachable Machine
2. ✅ Setup services (face-recognition & gateway)
3. ✅ Configure & upload ESP32 code
4. ✅ Test end-to-end flow
5. ⏳ Add database for attendance logging (optional)
6. ⏳ Add authentication & security
7. ⏳ Deploy to production

## 📚 Additional Resources

- [Teachable Machine Docs](https://teachablemachine.withgoogle.com/)
- [TensorFlow Docs](https://www.tensorflow.org/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [NestJS Docs](https://docs.nestjs.com/)
- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)

---

**Questions atau issues?** Check the detailed `INTEGRATION_GUIDE.md` di `services/face-recognition/`
