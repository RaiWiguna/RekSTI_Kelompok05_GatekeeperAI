const int PIN_RELAY      = 23;    // GPIO 23 → relay IN
const int PIN_REED       = 21;    // GPIO 21 → reed sensor (NC, INPUT_PULLUP)
const bool RELAY_ACTIVE_LOW = true; // ganti false jika relay active-HIGH

const unsigned long UNLOCK_TIMEOUT_MS = 8000;  // safety timeout setelah UNLOCK
const unsigned long DEBOUNCE_MS       = 50;    // debounce reed sensor

enum LockState  { LOCKED_STATE, UNLOCKED_STATE };
enum DoorState  { DOOR_CLOSED_STATE, DOOR_OPENED_STATE };

LockState lockState = LOCKED_STATE;
DoorState doorState = DOOR_CLOSED_STATE;

unsigned long unlockTimestamp = 0;  // kapan terakhir UNLOCK dikirim
int lastReedRaw = -1;               // untuk debounce
unsigned long lastReedChangeMs = 0;

void setRelay(bool activate) {
  digitalWrite(PIN_RELAY, RELAY_ACTIVE_LOW ? !activate : activate);
}

void send(const char* msg) {
  Serial.println(msg);
}

void doUnlock() {
  setRelay(true);
  lockState = UNLOCKED_STATE;
  unlockTimestamp = millis();
  send("UNLOCKED");
}

void doLock() {
  setRelay(false);
  lockState = LOCKED_STATE;
  unlockTimestamp = 0;
  send("LOCKED");
}

void processCommand(const String& cmd) {
  if (cmd == "UNLOCK") {
    send("ACK:UNLOCK");
    doUnlock();
    return;
  }
  if (cmd == "LOCK") {
    send("ACK:LOCK");
    doLock();
    return;
  }
  if (cmd == "PING") {
    send("PONG");
    return;
  }
  if (cmd == "STATUS") {
    send(lockState == LOCKED_STATE ? "LOCKED" : "UNLOCKED");
    send(doorState == DOOR_CLOSED_STATE ? "DOOR_CLOSED" : "DOOR_OPENED");
    return;
  }
  send("ERR:UNKNOWN_CMD");
}

void updateDoorState() {
  int raw = digitalRead(PIN_REED);

  // deteksi perubahan
  if (raw != lastReedRaw) {
    lastReedRaw = raw;
    lastReedChangeMs = millis();
    return; // tunggu debounce
  }

  // baru proses setelah stabil >= DEBOUNCE_MS
  if (millis() - lastReedChangeMs < DEBOUNCE_MS) return;

  DoorState newDoor = (raw == LOW) ? DOOR_CLOSED_STATE : DOOR_OPENED_STATE;
  if (newDoor == doorState) return; // tidak ada perubahan

  doorState = newDoor;

  if (doorState == DOOR_OPENED_STATE) {
    unlockTimestamp = 0;
    send("DOOR_OPENED");
  } else {
    // pintu baru tertutup → auto-lock
    send("DOOR_CLOSED");
    if (lockState == UNLOCKED_STATE) {
      delay(1500);
      doLock();
    }
  }
}

void checkUnlockTimeout() {
  if (lockState != UNLOCKED_STATE) return;
  if (unlockTimestamp == 0) return;
  if (millis() - unlockTimestamp >= UNLOCK_TIMEOUT_MS) {
    // pintu tidak pernah dibuka dalam UNLOCK_TIMEOUT_MS → paksa lock
    doLock();
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_RELAY, OUTPUT);
  setRelay(false); // pastikan terkunci saat boot

  pinMode(PIN_REED, INPUT_PULLUP);
  lastReedRaw = digitalRead(PIN_REED);
  doorState = (lastReedRaw == LOW) ? DOOR_CLOSED_STATE : DOOR_OPENED_STATE;

  send("READY");
}

void loop() {
  // baca perintah dari serial (satu baris per perintah)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      processCommand(cmd);
    }
  }

  updateDoorState();
  checkUnlockTimeout();
}
