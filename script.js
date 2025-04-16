// Audio Context setup
let audioContext;
let masterGain;
let audioInitialized = false;
let droneGains = [];
let droneOscillators = [];
let lfoOscillator;
let lfoGain;
let lfoOffset;
let detuneIntervals = [];
let isMuted = true; // Track mute state, default to true

// Initialize audio
function initAudio() {
    if (audioInitialized) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0; // Start muted
    masterGain.connect(audioContext.destination);

    // Create drone sound
    createDrone();
    audioInitialized = true;
}

function createDrone() {
    // Create main oscillator (55 Hz - Low A)
    createDroneOscillator(55, 'sine', 0.1);
    
    // Create subtle fifth harmony (82.5 Hz)
    createDroneOscillator(82.5, 'sine', 0.03);
    
    // Create upper octave with slight detune
    createDroneOscillator(110.2, 'sine', 0.02);
    
    // Create subtle high harmony
    createDroneOscillator(220.4, 'sine', 0.015);

    // Add a very quiet noise component for texture
    createNoiseComponent();

    // Create LFO for subtle amplitude modulation
    createAmplitudeLFO();

    // Start modulation
    modulateDrone();
    // Start slow detune drift
    startDetuneDrift();
}

function createDroneOscillator(frequency, type, gainValue) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = (Math.random() - 0.5) * 2; // initial slight detune
    
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    gain.gain.value = gainValue;
    
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    oscillator.start();
    
    droneOscillators.push(oscillator);
    droneGains.push(gain);
}

function createNoiseComponent() {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 100;
    noiseFilter.Q.value = 0.5;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.005;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    noise.start();
}

function createAmplitudeLFO() {
    lfoOscillator = audioContext.createOscillator();
    lfoGain = audioContext.createGain();
    lfoOffset = audioContext.createConstantSource();
    
    lfoOscillator.frequency.value = 0.025; // Slower LFO (was 0.1)
    lfoGain.gain.value = 0.08; // LFO depth (max swing)
    lfoOffset.offset.value = 0.07; // Minimum gain (never fades out)
    
    lfoOscillator.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfoOffset.connect(masterGain.gain);
    
    lfoOscillator.start();
    lfoOffset.start();
}

function modulateDrone() {
    const now = audioContext.currentTime;
    const modulationDuration = 8 + Math.random() * 4; // Random duration between 8-12 seconds
    
    // Modulate each oscillator slightly differently
    droneOscillators.forEach((osc, index) => {
        const baseFreq = [55, 82.5, 110.2, 220.4][index];
        const modAmount = 2 + Math.random() * 2; // Random modulation amount between 2-4 Hz
        
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(
            baseFreq + modAmount, 
            now + modulationDuration / 2
        );
        osc.frequency.linearRampToValueAtTime(
            baseFreq, 
            now + modulationDuration
        );
    });
    
    // Schedule next modulation
    setTimeout(modulateDrone, modulationDuration * 1000);
}

function startDetuneDrift() {
    droneOscillators.forEach((osc, idx) => {
        function drift() {
            const now = audioContext.currentTime;
            const driftAmount = (Math.random() - 0.5) * 8; // up to +/-4 cents
            osc.detune.linearRampToValueAtTime(driftAmount, now + 10 + Math.random() * 10); // drift over 10-20s
            detuneIntervals[idx] = setTimeout(drift, 10000 + Math.random() * 10000);
        }
        drift();
    });
}

// Try to initialize audio immediately
try {
    initAudio();
} catch (e) {
    console.log('Audio will be initialized on first interaction');
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
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
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
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
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

function updateAudioIcon(isMutedNow) {
    audioIcon.className = isMutedNow ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}

function muteAudio() {
    if (lfoGain && lfoOffset) {
        lfoGain.disconnect();
        lfoOffset.disconnect();
    }
    masterGain.gain.value = 0;
    isMuted = true;
    updateAudioIcon(true);
}

function unmuteAudio() {
    if (lfoGain && lfoOffset) {
        lfoGain.connect(masterGain.gain);
        lfoOffset.connect(masterGain.gain);
    }
    masterGain.gain.value = 0.3;
    isMuted = false;
    updateAudioIcon(false);
}

// Set initial icon state
updateAudioIcon(true);

audioToggle.addEventListener('click', () => {
    if (!audioInitialized) {
        initAudio();
    }
    if (isMuted) {
        unmuteAudio();
    } else {
        muteAudio();
    }
});

// Add interaction listener for browsers that require user interaction
document.addEventListener('click', () => {
    if (!audioInitialized) {
        initAudio();
    }
}, { once: true });

// Start animation immediately
animate();
scheduleNextGlitch(); 