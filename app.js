document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const debugPlane = document.getElementById('debug-plane');
    const debugInfo = document.getElementById('debug-info');

    // Function to update debug information
    function updateDebugInfo(plane) {
        if (plane) {
            const position = plane.object3D.position;
            const rotation = plane.object3D.rotation;
            debugInfo.innerHTML = `
                Plane Detected!<br>
                Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
                Rotation: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})
            `;
        } else {
            debugInfo.innerHTML = 'No plane detected. Move your device around to find surfaces.';
        }
    }

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
    updateDebugInfo(null);
}); 