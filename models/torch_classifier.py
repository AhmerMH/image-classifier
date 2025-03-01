import torch
from torchvision import models, transforms
from PIL import Image

class PyTorchClassifier:
    def __init__(self):
        self.model = models.resnet50(pretrained=True)
        self.model.eval()
        
        # ImageNet labels
        with open('models/imagenet_classes.txt') as f:
            self.labels = [line.strip() for line in f.readlines()]
            
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
    def predict(self, image_path):
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            
        top5_prob, top5_catid = torch.topk(probabilities, 5)
        results = []
        
        for i in range(5):
            results.append({
                'label': self.labels[top5_catid[i]],
                'confidence': float(top5_prob[i])
            })
            
        return results
