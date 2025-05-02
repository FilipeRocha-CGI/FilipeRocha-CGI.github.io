let scene, camera, renderer;
let controller;
let reticle;
let planes = [];
let debugInfo;

init();
animate();

function init() {
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
    
    // Add AR button
    document.body.appendChild(THREE.ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
    }));
    
    // Create controller
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    
    // Create reticle
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.1, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    
    // Add lights
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    
    // Get debug info element
    debugInfo = document.getElementById('debug-info');
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelect() {
    if (reticle.visible) {
        const planeGeometry = new THREE.PlaneGeometry(1, 1);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x7BC8A4,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.copy(reticle.position);
        plane.rotation.copy(reticle.rotation);
        scene.add(plane);
        planes.push(plane);
        
        updateDebugInfo(plane);
    }
}

function updateDebugInfo(plane) {
    if (plane) {
        const position = plane.position;
        const rotation = plane.rotation;
        debugInfo.innerHTML = `
            Plane Detected!<br>
            Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
            Rotation: (${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})
        `;
    } else {
        debugInfo.innerHTML = 'No plane detected. Move your device around to find surfaces.';
    }
}

function handlePlaneDetection() {
    const session = renderer.xr.getSession();
    if (!session) return;
    
    const referenceSpace = renderer.xr.getReferenceSpace();
    const frame = renderer.xr.getFrame();
    
    if (frame) {
        const hitTestResults = frame.getHitTestResults(referenceSpace);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
        } else {
            reticle.visible = false;
        }
    }
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    handlePlaneDetection();
    renderer.render(scene, camera);
} 