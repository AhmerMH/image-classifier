document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('image-upload');
  if (!fileInput.files.length) {
    alert('Please select an image to upload');
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  // Show loading
  document.getElementById('loading').style.display = 'block';
  document.getElementById('results').style.display = 'none';

  try {
    const response = await fetch('/classify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Display results
      document.getElementById('preview-image').src = data.image_url;

      // TensorFlow results
      const tfResultsDiv = document.getElementById('tensorflow-results');
      tfResultsDiv.innerHTML = '';
      data.tensorflow.forEach((result) => {
        const percentage = (result.confidence * 100).toFixed(2);
        tfResultsDiv.innerHTML += `
                            <div class="prediction-row">
                                <span>${result.label}</span>
                                <span>${percentage}%</span>
                            </div>
                        `;
      });

      // PyTorch results
      const pyTorchResultsDiv = document.getElementById('pytorch-results');
      pyTorchResultsDiv.innerHTML = '';
      data.pytorch.forEach((result) => {
        const percentage = (result.confidence * 100).toFixed(2);
        pyTorchResultsDiv.innerHTML += `
                            <div class="prediction-row">
                                <span>${result.label}</span>
                                <span>${percentage}%</span>
                            </div>
                        `;
      });

      // Create visualizations
      createCharts(data);

      // Generate insights
      generateInsights(data);

      document.getElementById('results').style.display = 'block';
    } else {
      alert(`Error: ${data.error || 'Something went wrong'}`);
    }
  } catch (error) {
    alert('Error: Could not connect to the server');
    console.error(error);
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
});

// Chart objects to destroy and recreate on new data
let tfChart = null;
let torchChart = null;
let comparisonChart = null;

function createCharts(data) {
  // Prepare TensorFlow chart data
  const tfLabels = data.tensorflow.map((item) => item.label);
  const tfValues = data.tensorflow.map((item) =>
    (item.confidence * 100).toFixed(2)
  );

  // Prepare PyTorch chart data
  const torchLabels = data.pytorch.map((item) => item.label);
  const torchValues = data.pytorch.map((item) =>
    (item.confidence * 100).toFixed(2)
  );

  // Destroy previous charts if they exist
  if (tfChart) tfChart.destroy();
  if (torchChart) torchChart.destroy();
  if (comparisonChart) comparisonChart.destroy();

  // Create TensorFlow chart
  const tfCtx = document.getElementById('tensorflow-chart').getContext('2d');
  tfChart = new Chart(tfCtx, {
    type: 'bar',
    data: {
      labels: tfLabels,
      datasets: [
        {
          label: 'Confidence (%)',
          data: tfValues,
          backgroundColor: 'var(--chart-color-1)',
          borderColor: 'var(--chart-border-1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'TensorFlow Model Confidence Scores',
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  // Create PyTorch chart
  const torchCtx = document.getElementById('pytorch-chart').getContext('2d');
  torchChart = new Chart(torchCtx, {
    type: 'bar',
    data: {
      labels: torchLabels,
      datasets: [
        {
          label: 'Confidence (%)',
          data: torchValues,
          backgroundColor: 'var(--chart-color-2)',
          borderColor: 'var(--chart-border-2)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'PyTorch Model Confidence Scores',
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

}

function generateInsights(data) {
  const insightsDiv = document.getElementById('insights-content');
  insightsDiv.innerHTML = '';

  const topTfPrediction = data.tensorflow[0];
  const topTorchPrediction = data.pytorch[0];

  // Compare top predictions
  const sameTopPrediction = topTfPrediction.label === topTorchPrediction.label;

  // Calculate confidence difference
  const tfConfidence = (topTfPrediction.confidence * 100).toFixed(2);
  const torchConfidence = (topTorchPrediction.confidence * 100).toFixed(2);
  const confidenceDiff = Math.abs(tfConfidence - torchConfidence).toFixed(2);

  // Find common predictions
  const tfLabels = data.tensorflow.map((item) => item.label);
  const torchLabels = data.pytorch.map((item) => item.label);
  const commonLabels = tfLabels.filter((label) => torchLabels.includes(label));

  // Calculate model agreement
  const agreementPercentage = ((commonLabels.length / 5) * 100).toFixed(0);

  // Generate insights text
  let insightsHtml = `
            <div class="alert ${
              sameTopPrediction ? 'alert-success' : 'alert-warning'
            }">
                <strong>Top Prediction:</strong> ${
                  sameTopPrediction
                    ? `Both models agree! The top prediction is "${topTfPrediction.label}".`
                    : `Models disagree. TensorFlow: "${topTfPrediction.label}", PyTorch: "${topTorchPrediction.label}"`
                }
            </div>
            <div class="alert alert-info">
                <strong>Confidence Analysis:</strong> 
                <p>TensorFlow confidence: ${tfConfidence}%, PyTorch confidence: ${torchConfidence}%</p>
                <p>Difference in confidence: ${confidenceDiff}%</p>
            </div>
            <div class="alert alert-primary">
                <strong>Model Agreement:</strong> The models have ${agreementPercentage}% agreement in their top 5 predictions (${
    commonLabels.length
  } common classes).
            </div>
        `;

  // Add confidence differences for common predictions
  if (commonLabels.length > 0) {
    insightsHtml += `<div class="mt-3"><strong>Common Predictions Comparison:</strong><ul>`;

    commonLabels.forEach((label) => {
      const tfResult = data.tensorflow.find((item) => item.label === label);
      const torchResult = data.pytorch.find((item) => item.label === label);

      const tfPercentage = (tfResult.confidence * 100).toFixed(2);
      const torchPercentage = (torchResult.confidence * 100).toFixed(2);
      const diffPercentage = Math.abs(tfPercentage - torchPercentage).toFixed(
        2
      );

      insightsHtml += `<li>"${label}": TF=${tfPercentage}%, PT=${torchPercentage}% (diff: ${diffPercentage}%)</li>`;
    });

    insightsHtml += `</ul></div>`;
  }

  insightsDiv.innerHTML = insightsHtml;
}
