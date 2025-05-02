// app.js
// Minimal AR.js marker detection script

document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  const debugInfo = document.getElementById('debug-info');

  // Update debug information based on marker detection
  function updateDebugInfo(marker) {
    if (marker) {
      const pos = marker.object3D.position;
      const rot = marker.object3D.rotation;
      debugInfo.innerHTML = `
        Marker Detected!<br>
        Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})<br>
        Rotation: (${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)})
      `;
    } else {
      debugInfo.innerHTML = 'No marker detected. Show the Hiro marker to the camera.';
    }
  }

  // Listen for marker found and lost events
  scene.addEventListener('markerFound', (evt) => {
    console.log('markerFound event:', evt.detail);
    updateDebugInfo(evt.detail.target);
  });
  scene.addEventListener('markerLost', () => {
    console.log('markerLost event');
    updateDebugInfo(null);
  });

  // Initial debug message
  updateDebugInfo(null);
}); 