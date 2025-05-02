document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const debugPlane = document.getElementById('debug-plane');
    const debugInfo = document.getElementById('debug-info');

    // Function to update debug information
    function updateDebugInfo(plane, cameraStatus = '') {
        if (plane) {
            const position = plane.object3D.position;
            const rotation = plane.object3D.rotation;
            const scale = plane.object3D.scale;
            debugInfo.innerHTML = `
                ${cameraStatus}<br>
                Plane Detected!<br>
                Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
                Rotation: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})<br>
                Scale: (${scale.x.toFixed(2)}, ${scale.y.toFixed(2)}, ${scale.z.toFixed(2)})
            `;
        } else {
            debugInfo.innerHTML = `${cameraStatus}<br>No plane detected. Move your device around to find surfaces.`;
        }
    }

    // Check camera access and set quality
    async function checkCameraAccess() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: { ideal: 'environment' },
                    zoom: { ideal: 1 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const settings = videoTrack.getSettings();

            // Log camera capabilities for debugging
            console.log('Camera capabilities:', capabilities);
            console.log('Camera settings:', settings);

            updateDebugInfo(null, `Camera access granted (${settings.width}x${settings.height})`);
            
            // Clean up
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            updateDebugInfo(null, `Camera access error: ${error.message}`);
        }
    }

    // Handle device-specific optimizations
    function optimizeForDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isMobile) {
            // Adjust scene settings for mobile devices
            scene.setAttribute('renderer', {
                ...scene.getAttribute('renderer'),
                precision: isIOS ? 'highp' : 'mediump',
                maxCanvasWidth: 1920,
                maxCanvasHeight: 1080
            });
        }
    }

    // Handle plane detection events
    function setupPlaneDetection() {
        // Listen for hit test results
        scene.addEventListener('ar-hit-test', (event) => {
            const hitTestResults = event.detail;
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                debugPlane.setAttribute('visible', 'true');
                debugPlane.object3D.position.copy(hit.point);
                debugPlane.object3D.rotation.copy(hit.rotation);
                updateDebugInfo(debugPlane);
            }
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
    }

    // Listen for scene loaded event
    scene.addEventListener('loaded', () => {
        optimizeForDevice();
        checkCameraAccess();
        setupPlaneDetection();
    });

    // Initial debug message
    updateDebugInfo(null, 'Initializing...');
}); 