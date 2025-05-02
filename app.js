document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const debugPlane = document.getElementById('debug-plane');
    const debugInfo = document.getElementById('debug-info');

    // Function to update debug information
    function updateDebugInfo(plane, cameraStatus = '') {
        if (plane) {
            const position = plane.object3D.position;
            const rotation = plane.object3D.rotation;
            debugInfo.innerHTML = `
                ${cameraStatus}<br>
                Plane Detected!<br>
                Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
                Rotation: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})
            `;
        } else {
            debugInfo.innerHTML = `${cameraStatus}<br>No plane detected. Move your device around to find surfaces.`;
        }
    }

    // Check camera access
    async function checkCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            updateDebugInfo(null, 'Camera access granted');
            stream.getTracks().forEach(track => track.stop()); // Stop the stream after checking
        } catch (error) {
            updateDebugInfo(null, `Camera access error: ${error.message}`);
        }
    }

    // Listen for scene loaded event
    scene.addEventListener('loaded', () => {
        checkCameraAccess();
    });

    // Listen for plane detection events
    scene.addEventListener('markerFound', (event) => {
        const marker = event.detail.target;
        debugPlane.setAttribute('visible', 'true');
        debugPlane.object3D.position.copy(marker.object3D.position);
        debugPlane.object3D.rotation.copy(marker.object3D.rotation);
        updateDebugInfo(debugPlane);
    });

    scene.addEventListener('markerLost', () => {
        debugPlane.setAttribute('visible', 'false');
        updateDebugInfo(null);
    });

    // Initial debug message
    updateDebugInfo(null, 'Initializing...');
}); 