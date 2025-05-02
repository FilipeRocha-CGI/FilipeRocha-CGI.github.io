let scene, camera, renderer;
let debugInfo;
let currentSession = null;
let xrRefSpace = null;

// Initialize the scene
init();
animate();

async function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    
    // Get debug info element
    debugInfo = document.getElementById('debug-info');
    
    // Setup AR button
    const arButton = document.getElementById('ar-button');
    arButton.addEventListener('click', startAR);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function startAR() {
    try {
        // Check if WebXR is available
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }

        // Request AR session
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });

        currentSession = session;
        xrRefSpace = await session.requestReferenceSpace('local');

        // Setup session
        renderer.xr.setReferenceSpace(xrRefSpace);
        renderer.xr.setSession(session);

        // Add end session button
        const endButton = document.createElement('button');
        endButton.textContent = 'End AR';
        endButton.style.position = 'fixed';
        endButton.style.top = '20px';
        endButton.style.right = '20px';
        endButton.style.zIndex = '1000';
        endButton.addEventListener('click', () => {
            if (currentSession) {
                currentSession.end();
            }
        });
        document.body.appendChild(endButton);

        // Update debug info
        updateDebugInfo('AR session started. Move your device around to detect surfaces.');

        // Handle session end
        session.addEventListener('end', () => {
            currentSession = null;
            xrRefSpace = null;
            endButton.remove();
            updateDebugInfo('AR session ended.');
        });

    } catch (error) {
        updateDebugInfo(`Error: ${error.message}`);
        console.error('AR session error:', error);
    }
}

function updateDebugInfo(message) {
    debugInfo.innerHTML = message;
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (currentSession) {
        const frame = renderer.xr.getFrame();
        if (frame) {
            // Get hit test results
            const hitTestResults = frame.getHitTestResults(xrRefSpace);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(xrRefSpace);
                
                // Create a plane at hit position
                const planeGeometry = new THREE.PlaneGeometry(1, 1);
                const planeMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x7BC8A4,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.matrix.fromArray(pose.transform.matrix);
                scene.add(plane);
                
                updateDebugInfo('Plane detected!');
            }
        }
    }
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const debugInfo = document.getElementById('debug-info');

    // Function to update debug information
    function updateDebugInfo(marker, cameraStatus = '') {
        if (marker) {
            const position = marker.object3D.position;
            const rotation = marker.object3D.rotation;
            debugInfo.innerHTML = `
                ${cameraStatus}<br>
                Marker Detected!<br>
                Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
                Rotation: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})
            `;
        } else {
            debugInfo.innerHTML = `${cameraStatus}<br>No marker detected. Show the Hiro marker to the camera.`;
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

    // Listen for marker events
    scene.addEventListener('markerFound', (event) => {
        const marker = event.detail.target;
        updateDebugInfo(marker);
    });

    scene.addEventListener('markerLost', () => {
        updateDebugInfo(null);
    });

    // Listen for scene loaded event
    scene.addEventListener('loaded', () => {
        optimizeForDevice();
        checkCameraAccess();
    });

    // Initial debug message
    updateDebugInfo(null, 'Initializing...');
}); 