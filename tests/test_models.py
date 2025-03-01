import os
import pytest
from PIL import Image
import numpy as np
from models.tf_classifier import TensorFlowClassifier
from models.torch_classifier import PyTorchClassifier

# Create a fixture for test image
@pytest.fixture
def test_image_path():
    # Create a directory for test resources if it doesn't exist
    os.makedirs('tests/resources', exist_ok=True)
    
    # Create a simple test image (a red square)
    img = Image.new('RGB', (224, 224), color='red')
    path = 'tests/resources/test_red_square.jpg'
    img.save(path)
    
    yield path
    
    # Cleanup
    if os.path.exists(path):
        os.remove(path)

class TestTensorFlowClassifier:
    def test_initialization(self):
        """Test if the TensorFlow model initializes correctly"""
        model = TensorFlowClassifier()
        assert model is not None
    
    def test_prediction_format(self, test_image_path):
        """Test if predictions have the expected format"""
        model = TensorFlowClassifier()
        predictions = model.predict(test_image_path)
        
        # Check that we get a list of dictionaries with expected keys
        assert isinstance(predictions, list)
        assert len(predictions) > 0
        assert all(isinstance(pred, dict) for pred in predictions)
        assert all('label' in pred and 'confidence' in pred for pred in predictions)
        
        # Check confidence values are between 0 and 1
        assert all(0 <= pred['confidence'] <= 1 for pred in predictions)

class TestPyTorchClassifier:
    def test_initialization(self):
        """Test if the PyTorch model initializes correctly"""
        model = PyTorchClassifier()
        assert model is not None
    
    def test_prediction_format(self, test_image_path):
        """Test if predictions have the expected format"""
        model = PyTorchClassifier()
        predictions = model.predict(test_image_path)
        
        # Check that we get a list of dictionaries with expected keys
        assert isinstance(predictions, list)
        assert len(predictions) > 0
        assert all(isinstance(pred, dict) for pred in predictions)
        assert all('label' in pred and 'confidence' in pred for pred in predictions)
        
        # Check confidence values are between 0 and 1
        assert all(0 <= pred['confidence'] <= 1 for pred in predictions)
    
    def test_top_predictions_count(self, test_image_path):
        """Test that we get the expected number of predictions"""
        model = PyTorchClassifier()
        predictions = model.predict(test_image_path)
        
        # Both models should return top 5 predictions by default
        assert len(predictions) == 5
