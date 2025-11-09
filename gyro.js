import * as THREE from 'three';

class GyroIndicator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Gyro indicator container not found');
            return;
        }

        this.ballVelocity = new THREE.Vector2(0, 0);
        this.gravity = new THREE.Vector2(0, 0);
        this.clock = new THREE.Clock();

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
        const beta = event.beta;   // Range: -180 to 180

        const gravityConstant = 9.8;

        // Convert degrees to radians
        const gammaRad = THREE.MathUtils.degToRad(gamma);
        const betaRad = THREE.MathUtils.degToRad(beta);

        // Update gravity vector based on device tilt.
        // This vector represents the acceleration applied to the ball.
        this.gravity.x = gravityConstant * Math.sin(gammaRad);
        this.gravity.y = gravityConstant * Math.sin(betaRad);
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

        const dt = this.clock.getDelta();
        const damping = 0.98; // friction/air resistance
        const max_dist = 1.7; // outer radius (2) - inner radius (0.3)

        // Update velocity based on gravity (acceleration)
        this.ballVelocity.x += this.gravity.x * dt;
        this.ballVelocity.y += this.gravity.y * dt;

        // Apply damping
        this.ballVelocity.multiplyScalar(damping);

        // Update position based on velocity
        this.innerBall.position.x += this.ballVelocity.x * dt;
        this.innerBall.position.y += this.ballVelocity.y * dt;

        // Check for collision with the outer sphere
        const distanceFromCenter = Math.sqrt(this.innerBall.position.x ** 2 + this.innerBall.position.y ** 2);
        
        if (distanceFromCenter > max_dist) {
            // Normalize the position vector to get the direction from center
            const normal = new THREE.Vector2(this.innerBall.position.x, this.innerBall.position.y).normalize();
            
            // Project velocity onto the normal vector
            const projection = this.ballVelocity.dot(normal);
            
            // Reflect the velocity component that is along the normal (away from center)
            if (projection > 0) {
                const reflect = normal.multiplyScalar(-2 * projection);
                this.ballVelocity.add(reflect);
            }
            
            // Clamp position to be inside the sphere to prevent it from getting stuck outside
            const clampedPosition = normal.multiplyScalar(max_dist);
            this.innerBall.position.x = clampedPosition.x;
            this.innerBall.position.y = clampedPosition.y;
        }

        // Rotate the outer sphere for a dynamic effect
        this.outerSphere.rotation.x += 0.001;
        this.outerSphere.rotation.y += 0.002;

        this.renderer.render(this.scene, this.camera);
    }
}

export default GyroIndicator;