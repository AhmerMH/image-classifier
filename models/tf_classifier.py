import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
import numpy as np

class TensorFlowClassifier:
    def __init__(self):
        self.model = MobileNetV2(weights='imagenet')
        
    def predict(self, image_path):
        img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        processed_img = preprocess_input(img_array)
        
        predictions = self.model.predict(processed_img)
        results = decode_predictions(predictions, top=5)[0]
        
        return [{'label': label, 'confidence': float(score)} for _, label, score in results]
