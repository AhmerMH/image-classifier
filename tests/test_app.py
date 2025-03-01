import os
import pytest
import json
from io import BytesIO
from PIL import Image
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def test_image():
    """Create a test image in memory"""
    img = Image.new('RGB', (224, 224), color='blue')
    img_io = BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    return img_io

class TestFlaskApp:
    def test_index_route(self, client):
        """Test that the index route returns the expected page"""
        response = client.get('/')
        assert response.status_code == 200
        assert b'Image Classifier' in response.data
    
    def test_classify_route_no_image(self, client):
        """Test the classify route with no image"""
        response = client.post('/classify')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_classify_route_with_image(self, client, test_image):
        """Test the classify route with a valid image"""
        data = {
            'image': (test_image, 'test_image.jpg')
        }
        response = client.post('/classify', 
                              content_type='multipart/form-data',
                              data=data)
        
        assert response.status_code == 200
        result = json.loads(response.data)
        
        # Check that the response has the expected structure
        assert 'tensorflow' in result
        assert 'pytorch' in result
        assert 'image_url' in result
        
        # Check that each model returned predictions
        assert isinstance(result['tensorflow'], list)
        assert isinstance(result['pytorch'], list)
        assert len(result['tensorflow']) > 0
        assert len(result['pytorch']) > 0
        
        # Verify image URL format
        assert result['image_url'].startswith('/uploads/')
        
        # Check cleanup of test image
        filename = result['image_url'].split('/')[-1]
        uploaded_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        assert os.path.exists(uploaded_path)
