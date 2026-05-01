from fastapi import FastAPI


app = FastAPI(title="Gatekeeper Face Recognition")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "face-recognition", "status": "ok"}

