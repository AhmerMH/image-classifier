import os
import logging
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import uuid
from models.tf_classifier import TensorFlowClassifier
from models.torch_classifier import PyTorchClassifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
logger.info(f"Upload directory created/confirmed at: {os.path.abspath(app.config['UPLOAD_FOLDER'])}")

# Initialize models
logger.info("Initializing TensorFlow model...")
tf_model = TensorFlowClassifier()
logger.info("TensorFlow model loaded successfully")

logger.info("Initializing PyTorch model...")
torch_model = PyTorchClassifier()
logger.info("PyTorch model loaded successfully")

@app.route('/')
def index():
    logger.info("Index page requested")
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify_image():
    logger.info("Image classification requested")
    
    if 'image' not in request.files:
        logger.warning("No image file in request")
        return jsonify({'error': 'No image uploaded'}), 400
        
    image = request.files['image']
    
    if image.filename == '':
        logger.warning("Empty filename submitted")
        return jsonify({'error': 'No image selected'}), 400
        
    if image:
        # Generate unique filename
        filename = str(uuid.uuid4()) + os.path.splitext(image.filename)[1]
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(image_path)
        logger.info(f"Image saved as {image_path}")
        
        # Get predictions from both models
        try:
            logger.info(f"Running TensorFlow prediction on {filename}")
            tf_results = tf_model.predict(image_path)
            logger.info("TensorFlow prediction complete")
            
            logger.info(f"Running PyTorch prediction on {filename}")
            torch_results = torch_model.predict(image_path)
            logger.info("PyTorch prediction complete")
            
            logger.info(f"Classification complete for {filename}")
            return jsonify({
                'tensorflow': tf_results,
                'pytorch': torch_results,
                'image_url': f'/uploads/{filename}'
            })
            
        except Exception as e:
            logger.error(f"Error during classification: {str(e)}", exc_info=True)
            return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    logger.info(f"Serving uploaded file: {filename}")
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    logger.info("Starting image classifier application...")
    app.run(debug=True)
    logger.info("Application shutdown")
