// Audio Context setup
let audioContext;
let droneOscillator;
let droneGain;
let masterGain;
let audioInitialized = false;

// Initialize audio
function initAudio() {
    if (audioInitialized) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioContext.destination);

    // Create drone sound
    createDrone();
    audioInitialized = true;
}

function createDrone() {
    // Create and configure drone oscillator
    droneOscillator = audioContext.createOscillator();
    droneOscillator.type = 'sine';
    droneOscillator.frequency.value = 55; // Low A

    // Create gain node for drone
    droneGain = audioContext.createGain();
    droneGain.gain.value = 0.1;

    // Create filter for drone
    const droneFilter = audioContext.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 200;

    // Connect drone components
    droneOscillator.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    // Start drone
    droneOscillator.start();

    // Add subtle modulation to drone
    modulateDrone();
}

function modulateDrone() {
    const now = audioContext.currentTime;
    droneOscillator.frequency.setValueAtTime(55, now);
    droneOscillator.frequency.linearRampToValueAtTime(57, now + 4);
    droneOscillator.frequency.linearRampToValueAtTime(55, now + 8);
    setTimeout(modulateDrone, 8000);
}

function createGlitchSound() {
    if (!audioInitialized) return;
    
    const now = audioContext.currentTime;
    
    // Create multiple short beeps
    for (let i = 0; i < 3; i++) {
        const glitchOsc = audioContext.createOscillator();
        const glitchGain = audioContext.createGain();
        
        // Random high frequency
        glitchOsc.frequency.value = 2000 + Math.random() * 8000;
        glitchOsc.type = 'square';
        
        glitchGain.gain.value = 0;
        
        glitchOsc.connect(glitchGain);
        glitchGain.connect(masterGain);
        
        const startTime = now + (i * 0.05);
        glitchOsc.start(startTime);
        glitchOsc.stop(startTime + 0.05);
        
        // Volume envelope
        glitchGain.gain.setValueAtTime(0, startTime);
        glitchGain.gain.linearRampToValueAtTime(0.1, startTime + 0.001);
        glitchGain.gain.linearRampToValueAtTime(0, startTime + 0.05);
    }
}

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a sphere of dots
const radius = 5;
const segments = 32;
const rings = 32;
const particles = segments * rings;

// Create geometry and material for particles
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particles * 3);
const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    sizeAttenuation: true
});

// Calculate positions for each dot on the sphere
for (let i = 0; i < rings; i++) {
    const lat = Math.PI * (-0.5 + i / rings);
    for (let j = 0; j < segments; j++) {
        const lon = 2 * Math.PI * j / segments;
        const index = i * segments + j;
        
        const x = radius * Math.cos(lat) * Math.cos(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.sin(lon);
        
        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const sphere = new THREE.Points(geometry, material);
scene.add(sphere);

// Position camera
camera.position.z = 15;

// Glitch effect variables
let isGlitching = false;
let glitchTimeout;
let originalPosition = { x: sphere.position.x, y: sphere.position.y, z: sphere.position.z };

function startGlitch() {
    if (!isGlitching) {
        isGlitching = true;
        // Random duration between 100ms and 300ms
        const duration = 100 + Math.random() * 200;
        
        // Play glitch sound if audio is initialized
        createGlitchSound();
        
        setTimeout(() => {
            isGlitching = false;
            // Reset position
            sphere.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
        }, duration);
    }
}

function scheduleNextGlitch() {
    // Random interval between 2 and 6 seconds
    const nextGlitch = 2000 + Math.random() * 4000;
    glitchTimeout = setTimeout(() => {
        startGlitch();
        scheduleNextGlitch();
    }, nextGlitch);
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    // Regular rotation
    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.002;
    
    // Apply glitch effect
    if (isGlitching) {
        sphere.position.x = originalPosition.x + (Math.random() - 0.5) * 0.2;
        sphere.position.y = originalPosition.y + (Math.random() - 0.5) * 0.2;
        sphere.position.z = originalPosition.z + (Math.random() - 0.5) * 0.2;
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Audio toggle functionality
const audioToggle = document.getElementById('audioToggle');
const audioIcon = audioToggle.querySelector('i');

function updateAudioIcon(isMuted) {
    audioIcon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}

audioToggle.addEventListener('click', () => {
    if (!audioInitialized) {
        initAudio();
    } else {
        const isMuted = masterGain.gain.value > 0;
        masterGain.gain.value = isMuted ? 0 : 0.3;
        updateAudioIcon(isMuted);
    }
});

// Start animation immediately
animate();
scheduleNextGlitch(); 