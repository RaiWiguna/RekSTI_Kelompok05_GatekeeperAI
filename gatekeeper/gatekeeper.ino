#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <LittleFS.h>
#include <time.h>

// ========== WIFI / HTTP CONFIGURATION ==========
// Ganti nilai ini sesuai jaringan lab/kampus.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// API key sederhana untuk perintah langsung ke device.
// Kirim sebagai header: X-Device-Key: CHANGE_ME_DEVICE_KEY
// Default dikosongkan agar kompatibel dengan dispatch API saat ini.
const char* DEVICE_COMMAND_KEY = "";

// Opsional: backend pusat untuk heartbeat/event sync.
// Dari ESP32, jangan pakai localhost. Pakai IP komputer/server, contoh:
// http://192.168.1.10:3001/v1 atau http://103.31.38.237/v1
const char* CENTRAL_API_BASE_URL = "";
const char* GATEWAY_ID = "gw-01";
const char* GATEWAY_SECRET = "Gateway12345!";
const char* DEVICE_ID = "DEV-R101-01";
const char* ROOM_CODE = "R101";

const int HTTP_PORT = 80;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 10000;
const unsigned long HEARTBEAT_INTERVAL_MS = 30000;
const unsigned long QUEUE_FLUSH_INTERVAL_MS = 15000;
const char* QUEUE_FILE = "/event_queue.ndjson";
const char* COMMAND_HEADER_KEYS[] = { "X-Device-Key" };

// ========== HARDWARE CONFIGURATION ==========
const int PIN_RELAY = 23;          // GPIO 23 -> relay IN
const int PIN_REED = 21;           // GPIO 21 -> reed sensor (NC, INPUT_PULLUP)
const bool RELAY_ACTIVE_LOW = true;

const unsigned long UNLOCK_TIMEOUT_MS = 8000;
const unsigned long DEBOUNCE_MS = 50;

enum LockState { LOCKED_STATE, UNLOCKED_STATE };
enum DoorState { DOOR_CLOSED_STATE, DOOR_OPENED_STATE };

WebServer server(HTTP_PORT);

LockState lockState = LOCKED_STATE;
DoorState doorState = DOOR_CLOSED_STATE;

String gatewayAccessToken = "";
unsigned long unlockTimestamp = 0;
unsigned long lastWifiReconnectAttemptMs = 0;
unsigned long lastHeartbeatMs = 0;
unsigned long lastQueueFlushMs = 0;
unsigned long eventCounter = 0;
int lastReedRaw = -1;
unsigned long lastReedChangeMs = 0;

void setRelay(bool activate) {
  digitalWrite(PIN_RELAY, RELAY_ACTIVE_LOW ? !activate : activate);
}

void sendSerial(const char* msg) {
  Serial.println(msg);
}

String lockStateText() {
  return lockState == LOCKED_STATE ? "LOCKED" : "UNLOCKED";
}

String doorStateText() {
  return doorState == DOOR_CLOSED_STATE ? "DOOR_CLOSED" : "DOOR_OPENED";
}

String jsonEscape(const String& value) {
  String out = "";
  for (size_t i = 0; i < value.length(); i++) {
    char c = value.charAt(i);
    if (c == '"' || c == '\\') {
      out += '\\';
      out += c;
    } else if (c == '\n') {
      out += "\\n";
    } else if (c == '\r') {
      out += "\\r";
    } else {
      out += c;
    }
  }
  return out;
}

String isoTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 50)) {
    char buffer[32];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S+07:00", &timeinfo);
    return String(buffer);
  }

  return String("1970-01-01T00:00:00+07:00");
}

String makeEventId(const String& eventType) {
  eventCounter++;
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  return String(DEVICE_ID) + "-" + mac + "-" + eventType + "-" + String(millis()) + "-" + String(eventCounter);
}

int queuedEventCount() {
  File file = LittleFS.open(QUEUE_FILE, "r");
  if (!file) return 0;

  int count = 0;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) count++;
  }
  file.close();
  return count;
}

String buildEventPayload(const String& eventType, const String& accessResult) {
  String eventId = makeEventId(eventType);
  String payload = "{";
  payload += "\"event_id\":\"" + jsonEscape(eventId) + "\",";
  payload += "\"device_id\":\"" + jsonEscape(DEVICE_ID) + "\",";
  payload += "\"room_code\":\"" + jsonEscape(ROOM_CODE) + "\",";
  payload += "\"event_type\":\"" + jsonEscape(eventType) + "\",";
  payload += "\"event_at\":\"" + isoTimestamp() + "\",";
  payload += "\"access_result\":\"" + jsonEscape(accessResult) + "\",";
  payload += "\"gateway_id\":\"" + jsonEscape(GATEWAY_ID) + "\",";
  payload += "\"sync_version\":1";
  payload += "}";
  return payload;
}

void enqueueEvent(const String& eventType, const String& accessResult) {
  String payload = buildEventPayload(eventType, accessResult);
  File file = LittleFS.open(QUEUE_FILE, "a");
  if (!file) {
    Serial.println("ERR:QUEUE_OPEN_FAILED");
    return;
  }

  file.println(payload);
  file.close();
  Serial.println("QUEUE:" + payload);
}

bool hasCentralApi() {
  return String(CENTRAL_API_BASE_URL).length() > 0;
}

String extractJsonString(const String& json, const String& key) {
  String marker = "\"" + key + "\"";
  int keyIndex = json.indexOf(marker);
  if (keyIndex < 0) return "";

  int colonIndex = json.indexOf(':', keyIndex + marker.length());
  if (colonIndex < 0) return "";

  int startQuote = json.indexOf('"', colonIndex + 1);
  if (startQuote < 0) return "";

  int endQuote = json.indexOf('"', startQuote + 1);
  if (endQuote < 0) return "";

  return json.substring(startQuote + 1, endQuote);
}

bool authenticateGateway() {
  if (!hasCentralApi()) return false;
  if (gatewayAccessToken.length() > 0) return true;

  HTTPClient http;
  String url = String(CENTRAL_API_BASE_URL) + "/gateway/auth";
  String body = "{\"gateway_id\":\"" + jsonEscape(GATEWAY_ID) + "\",\"secret\":\"" + jsonEscape(GATEWAY_SECRET) + "\"}";

  http.setTimeout(5000);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int statusCode = http.POST(body);
  String response = http.getString();
  http.end();

  if (statusCode < 200 || statusCode >= 300) {
    Serial.printf("Gateway auth failed: HTTP %d\n", statusCode);
    return false;
  }

  gatewayAccessToken = extractJsonString(response, "access_token");
  if (gatewayAccessToken.length() == 0) {
    Serial.println("Gateway auth failed: token not found");
    return false;
  }

  Serial.println("Gateway auth OK");
  return true;
}

bool postJsonToCentralApi(const String& path, const String& body, const String& idempotencyKey = "") {
  if (!hasCentralApi()) return false;
  if (!authenticateGateway()) return false;

  HTTPClient http;
  String url = String(CENTRAL_API_BASE_URL) + path;

  http.setTimeout(5000);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + gatewayAccessToken);
  if (idempotencyKey.length() > 0) {
    http.addHeader("Idempotency-Key", idempotencyKey);
  }

  int statusCode = http.POST(body);
  String response = http.getString();
  http.end();

  if (statusCode == 401 || statusCode == 403) {
    gatewayAccessToken = "";
  }

  if (statusCode >= 200 && statusCode < 300) {
    Serial.printf("POST %s OK\n", path.c_str());
    return true;
  }

  Serial.printf("POST %s failed: HTTP %d %s\n", path.c_str(), statusCode, response.c_str());
  return false;
}

String eventIdFromPayload(const String& payload) {
  return extractJsonString(payload, "event_id");
}

void flushQueuedEvents() {
  if (!hasCentralApi() || WiFi.status() != WL_CONNECTED) return;

  File file = LittleFS.open(QUEUE_FILE, "r");
  if (!file) return;

  String remaining = "";
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    String eventId = eventIdFromPayload(line);
    bool sent = postJsonToCentralApi("/gateway/events", line, eventId);
    if (!sent) {
      remaining += line + "\n";
    }
  }
  file.close();

  File out = LittleFS.open(QUEUE_FILE, "w");
  if (out) {
    out.print(remaining);
    out.close();
  }
}

void sendHeartbeat() {
  if (!hasCentralApi() || WiFi.status() != WL_CONNECTED) return;

  String body = "{";
  body += "\"gateway_id\":\"" + jsonEscape(GATEWAY_ID) + "\",";
  body += "\"device_id\":\"" + jsonEscape(DEVICE_ID) + "\",";
  body += "\"status\":\"online\",";
  body += "\"queued_events\":" + String(queuedEventCount()) + ",";
  body += "\"sent_at\":\"" + isoTimestamp() + "\"";
  body += "}";

  postJsonToCentralApi("/gateway/heartbeat", body);
}

void doUnlock(const String& source = "http") {
  setRelay(true);
  lockState = UNLOCKED_STATE;
  unlockTimestamp = millis();
  sendSerial("UNLOCKED");
  enqueueEvent("override", "granted");
}

void doLock(const String& source = "http") {
  setRelay(false);
  lockState = LOCKED_STATE;
  unlockTimestamp = 0;
  sendSerial("LOCKED");
  enqueueEvent("override", "granted");
}

String statusJson() {
  String body = "{";
  body += "\"ok\":true,";
  body += "\"device_id\":\"" + jsonEscape(DEVICE_ID) + "\",";
  body += "\"gateway_id\":\"" + jsonEscape(GATEWAY_ID) + "\",";
  body += "\"room_code\":\"" + jsonEscape(ROOM_CODE) + "\",";
  body += "\"wifi_connected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
  body += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  body += "\"lock\":\"" + lockStateText() + "\",";
  body += "\"door\":\"" + doorStateText() + "\",";
  body += "\"queued_events\":" + String(queuedEventCount()) + ",";
  body += "\"uptime_ms\":" + String(millis());
  body += "}";
  return body;
}

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type,X-Device-Key");
}

bool isAuthorizedCommand() {
  if (String(DEVICE_COMMAND_KEY).length() == 0) return true;

  String providedKey = server.header("X-Device-Key");
  if (providedKey == DEVICE_COMMAND_KEY) return true;

  addCorsHeaders();
  server.send(401, "application/json", "{\"ok\":false,\"error\":\"unauthorized_device_command\"}");
  return false;
}

void sendJson(int statusCode, const String& body) {
  addCorsHeaders();
  server.send(statusCode, "application/json", body);
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleUnlock() {
  if (!isAuthorizedCommand()) return;
  doUnlock("http");
  sendJson(200, "{\"ok\":true,\"command\":\"UNLOCK\",\"lock\":\"UNLOCKED\"}");
}

void handleLock() {
  if (!isAuthorizedCommand()) return;
  doLock("http");
  sendJson(200, "{\"ok\":true,\"command\":\"LOCK\",\"lock\":\"LOCKED\"}");
}

void handlePing() {
  sendJson(200, "{\"ok\":true,\"message\":\"PONG\"}");
}

void handleStatus() {
  sendJson(200, statusJson());
}

void handleNotFound() {
  if (server.method() == HTTP_OPTIONS) {
    handleOptions();
    return;
  }

  sendJson(404, "{\"ok\":false,\"error\":\"not_found\"}");
}

void registerCommandRoute(const char* path, void (*handler)()) {
  server.on(path, HTTP_GET, handler);
  server.on(path, HTTP_POST, handler);
  server.on(path, HTTP_OPTIONS, handleOptions);
}

void setupHttpServer() {
  server.collectHeaders(COMMAND_HEADER_KEYS, 1);

  server.on("/", HTTP_GET, handleStatus);
  registerCommandRoute("/unlock", handleUnlock);
  registerCommandRoute("/lock", handleLock);
  registerCommandRoute("/ping", handlePing);
  registerCommandRoute("/status", handleStatus);
  registerCommandRoute("/v1/gateway/unlock", handleUnlock);
  registerCommandRoute("/v1/gateway/lock", handleLock);
  registerCommandRoute("/v1/gateway/ping", handlePing);
  registerCommandRoute("/v1/gateway/status", handleStatus);
  registerCommandRoute("/v1/gateway/status/refresh", handleStatus);
  server.onNotFound(handleNotFound);
  server.begin();

  Serial.printf("HTTP server ready on port %d\n", HTTP_PORT);
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com");
  } else {
    Serial.println("WiFi connection failed; device logic will keep running");
  }
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiReconnectAttemptMs < WIFI_RECONNECT_INTERVAL_MS) return;

  lastWifiReconnectAttemptMs = millis();
  Serial.println("Reconnecting WiFi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void processCommand(const String& cmd) {
  if (cmd == "UNLOCK") {
    sendSerial("ACK:UNLOCK");
    doUnlock("serial");
    return;
  }
  if (cmd == "LOCK") {
    sendSerial("ACK:LOCK");
    doLock("serial");
    return;
  }
  if (cmd == "PING") {
    sendSerial("PONG");
    return;
  }
  if (cmd == "STATUS") {
    sendSerial(lockState == LOCKED_STATE ? "LOCKED" : "UNLOCKED");
    sendSerial(doorState == DOOR_CLOSED_STATE ? "DOOR_CLOSED" : "DOOR_OPENED");
    return;
  }
  sendSerial("ERR:UNKNOWN_CMD");
}

void updateDoorState() {
  int raw = digitalRead(PIN_REED);

  if (raw != lastReedRaw) {
    lastReedRaw = raw;
    lastReedChangeMs = millis();
    return;
  }

  if (millis() - lastReedChangeMs < DEBOUNCE_MS) return;

  DoorState newDoor = (raw == LOW) ? DOOR_CLOSED_STATE : DOOR_OPENED_STATE;
  if (newDoor == doorState) return;

  doorState = newDoor;

  if (doorState == DOOR_OPENED_STATE) {
    unlockTimestamp = 0;
    sendSerial("DOOR_OPENED");
    enqueueEvent("entry", "granted");
  } else {
    sendSerial("DOOR_CLOSED");
    enqueueEvent("exit", "granted");
    if (lockState == UNLOCKED_STATE) {
      delay(1500);
      doLock("door_closed");
    }
  }
}

void checkUnlockTimeout() {
  if (lockState != UNLOCKED_STATE) return;
  if (unlockTimestamp == 0) return;
  if (millis() - unlockTimestamp >= UNLOCK_TIMEOUT_MS) {
    doLock("timeout");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_RELAY, OUTPUT);
  setRelay(false);

  pinMode(PIN_REED, INPUT_PULLUP);
  lastReedRaw = digitalRead(PIN_REED);
  doorState = (lastReedRaw == LOW) ? DOOR_CLOSED_STATE : DOOR_OPENED_STATE;

  if (!LittleFS.begin(true)) {
    Serial.println("ERR:LITTLEFS_INIT_FAILED");
  }

  connectWiFi();
  setupHttpServer();
  sendSerial("READY");
}

void loop() {
  server.handleClient();

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      processCommand(cmd);
    }
  }

  ensureWiFi();
  updateDoorState();
  checkUnlockTimeout();

  if (millis() - lastQueueFlushMs >= QUEUE_FLUSH_INTERVAL_MS) {
    lastQueueFlushMs = millis();
    flushQueuedEvents();
  }

  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();
    sendHeartbeat();
  }
}
