import * as THREE from 'three';

class GyroIndicator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Gyro indicator container not found');
            return;
        }

        this.init();
        this.animate();
        this.setupGyro();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.z = 3.5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Outer Sphere (transparent)
        const outerGeometry = new THREE.SphereGeometry(2, 32, 16);
        const outerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeff, 
            transparent: true, 
            opacity: 0.15,
            metalness: 0.1,
            roughness: 0.2
        });
        this.outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
        this.scene.add(this.outerSphere);

        // Inner Ball
        const innerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const innerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff4444,
            metalness: 0.5,
            roughness: 0.1
        });
        this.innerBall = new THREE.Mesh(innerGeometry, innerMaterial);
        this.scene.add(this.innerBall);

        // Gizmo (Axes Helper)
        const axesHelper = new THREE.AxesHelper(1.5); // X=red, Y=green, Z=blue
        this.scene.add(axesHelper);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);
    }

    handleOrientation(event) {
        // gamma: left-to-right tilt, in degrees, where right is positive
        const gamma = event.gamma; // Range: -90 to 90
        // beta: front-to-back tilt, in degrees, where front is positive
        const beta = event.beta;   // Range: -180 to 180 (but typically -90 to 90 on phones)

        // Normalize tilts to a -1 to 1 range
        let x = (gamma / 90); 
        let y = (beta / 90);  

        // Clamp to ensure they are within -1 and 1
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));

        const max_dist = 1.7; // outer radius (2) - inner radius (0.3)

        this.innerBall.position.x = x * max_dist;
        this.innerBall.position.y = y * max_dist;
        this.innerBall.position.z = 0; // Keep on the XY plane for clarity
    }

    setupGyro() {
        const handlePermission = () => {
             // feature detect
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                        }
                    })
                    .catch(console.error);
            } else {
                // handle non-iOS 13+ devices
                window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            }
        };

        // Request permission on first user interaction
        document.body.addEventListener('pointerdown', handlePermission, { once: true });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Rotate the outer sphere for a dynamic effect
        this.outerSphere.rotation.x += 0.001;
        this.outerSphere.rotation.y += 0.002;

        this.renderer.render(this.scene, this.camera);
    }
}

export default GyroIndicator;