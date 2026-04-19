from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

model = load_model("mnist_model.h5")


def preprocess_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Invert if needed
    if np.mean(gray) > 127:
        gray = cv2.bitwise_not(gray)

    # Threshold (stronger for better 7 detection)
    _, gray = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)

    # Blur slightly (reduces noise)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Crop digit
    coords = cv2.findNonZero(gray)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        gray = gray[y:y+h, x:x+w]

    # Resize keeping ratio
    h, w = gray.shape
    if h > w:
        new_h = 20
        new_w = int(w * (20 / h))
    else:
        new_w = 20
        new_h = int(h * (20 / w))

    gray = cv2.resize(gray, (new_w, new_h))

    # Pad to 28x28
    top = (28 - new_h) // 2
    bottom = 28 - new_h - top
    left = (28 - new_w) // 2
    right = 28 - new_w - left

    gray = np.pad(gray, ((top, bottom), (left, right)), "constant", constant_values=0)

    gray = gray / 255.0

    return gray.reshape(1, 28, 28)


@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["file"]

    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    processed = preprocess_image(img)

    prediction = model.predict(processed, verbose=0)
    digit = int(np.argmax(prediction))

    return jsonify({"prediction": digit})


app.run(debug=True)

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)