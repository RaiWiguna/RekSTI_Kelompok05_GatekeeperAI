import io
import os
from typing import Optional
import numpy as np
from PIL import Image
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Global model
model = None
MODEL_PATH = os.getenv("MODEL_PATH", "./models/model.tflite")
CLASS_LABELS = []  # Will load from label.txt if available


def load_class_labels():
    """Load class labels from label.txt or labels.txt (Teachable Machine format)"""
    global CLASS_LABELS
    
    # Try both names
    label_paths = [
        os.path.join(os.path.dirname(MODEL_PATH), "labels.txt"),
        os.path.join(os.path.dirname(MODEL_PATH), "label.txt"),
    ]
    
    for label_path in label_paths:
        if os.path.exists(label_path):
            try:
                with open(label_path, "r") as f:
                    labels = []
                    for line in f.readlines():
                        line = line.strip()
                        if line:
                            # Handle Teachable Machine format: "0 Aliya" or just "Aliya"
                            parts = line.split(" ", 1)
                            if len(parts) == 2 and parts[0].isdigit():
                                # Format: "0 Aliya"
                                labels.append(parts[1])
                            else:
                                # Format: just "Aliya"
                                labels.append(line)
                    
                    CLASS_LABELS = labels
                    print(f"Loaded {len(labels)} class labels from {label_path}")
                    print(f"Labels: {labels}")
                    return True
            except Exception as e:
                print(f"Error loading class labels from {label_path}: {e}")
    
    print("No label.txt or labels.txt found - using generic class names")
    return False


def get_class_name(index: int) -> str:
    """Get class name by index, using loaded labels if available"""
    if index < len(CLASS_LABELS):
        return CLASS_LABELS[index]
    return f"class_{index}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown"""
    global model
    # Load class labels first
    load_class_labels()
    
    try:
        if os.path.exists(MODEL_PATH):
            print(f"Loading model from {MODEL_PATH}")
            # Support multiple formats: .tflite, .h5, .keras, SavedModel
            if MODEL_PATH.endswith(".tflite"):
                interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
                interpreter.allocate_tensors()
                model = interpreter
                print("TensorFlow Lite model loaded successfully")
            elif MODEL_PATH.endswith((".h5", ".keras")):
                model = tf.keras.models.load_model(MODEL_PATH)
                print(f"Keras model ({MODEL_PATH.split('.')[-1]}) loaded successfully")
            else:
                # Assume SavedModel format (directory)
                model = tf.keras.models.load_model(MODEL_PATH)
                print("TensorFlow SavedModel loaded successfully")
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
    
    yield
    
    # Cleanup
    model = None


app = FastAPI(
    title="Gatekeeper Face Recognition",
    lifespan=lifespan
)


@app.get("/health")
def health() -> dict:
    model_type = "not_loaded"
    if model is not None:
        if isinstance(model, tf.lite.Interpreter):
            model_type = "tflite"
        else:
            model_type = "keras/savedmodel"
    
    return {
        "service": "face-recognition",
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": model_type
    }


@app.post("/inference/detect")
async def detect_face(image: UploadFile = File(...)) -> JSONResponse:
    """
    Identify which person is in the image using the trained model.
    
    Expected response format:
    {
        "success": true,
        "result": {
            "identified_person": "class_0",  // person A, B, C, etc.
            "confidence": 0.95,
            "all_classes": [
                {"class": "class_0", "confidence": 0.95},
                {"class": "class_1", "confidence": 0.04},
                {"class": "class_2", "confidence": 0.01}
            ]
        }
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read image file
        contents = await image.read()
        image_pil = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess image
        image_array = np.array(image_pil)
        
        # Run inference
        if isinstance(model, tf.lite.Interpreter):
            result = _inference_tflite(image_array)
        else:
            result = _inference_savedmodel(image_array)
        
        return JSONResponse({
            "success": True,
            "result": result,
            "timestamp": str(np.datetime64('now'))
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": str(e)
            }
        )


@app.post("/inference/detect-base64")
async def detect_face_base64(data: dict) -> JSONResponse:
    """
    Identify person in base64 encoded image.
    Expected input: {"image": "base64_encoded_image"}
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        import base64
        
        image_data = data.get("image")
        if not image_data:
            raise ValueError("No image data provided")
        
        image_bytes = base64.b64decode(image_data)
        image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(image_pil)
        
        # Run inference
        if isinstance(model, tf.lite.Interpreter):
            result = _inference_tflite(image_array)
        else:
            result = _inference_savedmodel(image_array)
        
        return JSONResponse({
            "success": True,
            "result": result,
            "timestamp": str(np.datetime64('now'))
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": str(e)
            }
        )


@app.post("/model/reload")
async def reload_model() -> JSONResponse:
    """Reload the model from disk"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            if MODEL_PATH.endswith(".tflite"):
                interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
                interpreter.allocate_tensors()
                model = interpreter
            else:
                model = tf.keras.models.load_model(MODEL_PATH)
            return JSONResponse({"success": True, "message": "Model reloaded successfully"})
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Model not found at {MODEL_PATH}"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)}
        )


def _inference_savedmodel(image_array: np.ndarray) -> dict:
    """Run inference using SavedModel (Keras/SavedModel format)"""
    # Normalize image to [0, 1]
    if image_array.max() > 1:
        image_array = image_array / 255.0
    
    # Resize to model input size (assuming 224x224 for Teachable Machine)
    image_resized = np.array(Image.fromarray((image_array * 255).astype(np.uint8)).resize((224, 224)))
    if image_resized.max() > 1:
        image_resized = image_resized / 255.0
    
    # Add batch dimension
    image_batch = np.expand_dims(image_resized, axis=0).astype(np.float32)
    
    # Run prediction
    predictions = model.predict(image_batch, verbose=0)
    
    # Parse predictions - return best match + all scores
    confidence_scores = predictions[0]
    best_idx = np.argmax(confidence_scores)
    best_confidence = float(confidence_scores[best_idx])
    
    # Build detailed results using class labels
    all_scores = [
        {
            "class": get_class_name(idx),
            "confidence": float(confidence_scores[idx])
        }
        for idx in range(len(confidence_scores))
    ]
    
    return {
        "identified_person": get_class_name(best_idx),
        "confidence": best_confidence,
        "all_classes": all_scores
    }


def _inference_tflite(image_array: np.ndarray) -> dict:
    """Run inference using TensorFlow Lite (Quantized model)"""
    # Get input details
    input_details = model.get_input_details()
    output_details = model.get_output_details()
    
    # Prepare input
    input_shape = input_details[0]['shape']
    input_image = np.array(Image.fromarray(image_array).resize((input_shape[2], input_shape[1]))).astype(np.float32)
    
    if input_image.max() > 1:
        input_image = input_image / 255.0
    
    input_image = np.expand_dims(input_image, axis=0)
    
    # Set tensor and invoke
    model.set_tensor(input_details[0]['index'], input_image)
    model.invoke()
    
    # Get output
    output_data = model.get_tensor(output_details[0]['index'])
    
    # Parse results - return best match + all scores
    confidence_scores = output_data[0]
    best_idx = np.argmax(confidence_scores)
    best_confidence = float(confidence_scores[best_idx])
    
    # Build detailed results using class labels
    all_scores = [
        {
            "class": get_class_name(idx),
            "confidence": float(confidence_scores[idx])
        }
        for idx in range(len(confidence_scores))
    ]
    
    return {
        "identified_person": get_class_name(best_idx),
        "confidence": best_confidence,
        "all_classes": all_scores
    }

