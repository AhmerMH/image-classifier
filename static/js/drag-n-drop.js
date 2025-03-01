document.addEventListener('DOMContentLoaded', function () {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('image-upload');

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      updateImagePreview(fileInput.files[0]);
    }
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  dropZone.addEventListener('drop', handleDrop, false);

  document.addEventListener('paste', handlePaste, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  document.getElementById('drop-zone').classList.add('drop-zone--over');
}

function unhighlight() {
  document.getElementById('drop-zone').classList.remove('drop-zone--over');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  const fileInput = document.getElementById('image-upload');

  if (files.length && files[0].type.startsWith('image/')) {
    fileInput.files = files;
    updateImagePreview(files[0]);
  } else {
    alert('Please drop an image file');
  }
}

function handlePaste(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  const fileInput = document.getElementById('image-upload');

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();

      const file = new File([blob], 'pasted-image.png', { type: blob.type });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      updateImagePreview(file);
      break;
    }
  }
}

function updateImagePreview(file) {
  const dropZone = document.getElementById('drop-zone');

  const reader = new FileReader();
  reader.onload = function (e) {
    const tempPreview = document.createElement('img');
    tempPreview.src = e.target.result;
    tempPreview.style.maxWidth = '100%';
    tempPreview.style.maxHeight = '150px';
    tempPreview.style.marginTop = '10px';

    const existingPreviews = dropZone.querySelectorAll('img');
    existingPreviews.forEach((img) => img.remove());

    dropZone.appendChild(tempPreview);

    const promptElement = dropZone.querySelector('.drop-zone__prompt');
    promptElement.textContent = 'Image ready to classify';
  };
  reader.readAsDataURL(file);
}
