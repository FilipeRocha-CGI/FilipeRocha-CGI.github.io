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