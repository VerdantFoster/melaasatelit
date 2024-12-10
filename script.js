// Pengaturan Canvas
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Kontrol Fitur
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const resetBtn = document.getElementById('resetBtn');

// Tampilan Koordinat Satelit
const coordXSpan = document.getElementById('coordX');
const coordYSpan = document.getElementById('coordY');

// Skala untuk visualisasi
let scale = 4e-7; // Piksel per meter

// Parameter Gravitasi
const G = 6.67430e-11; // m^3 kg^-1 s^-2
const massJupiter = 1.898e27; // kg

// Waktu
const dt = 60; // Detik per langkah
let simulationSpeed = 5; // Kecepatan simulasi (1-10)

// Satelit Ganimede (Data Awal yang Akurat)
const initialPosition = { x: 1.07041e9, y: 0 }; // Meter
const initialVelocity = { x: 0, y: 1.074e4 }; // m/s

let position = { ...initialPosition };
let velocity = { ...initialVelocity };

// Trail
let trail = [];

// Fungsi untuk menghitung percepatan
function computeAcceleration(pos) {
    const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const accelMagnitude = -G * massJupiter / (distance * distance);
    return {
        x: accelMagnitude * (pos.x / distance),
        y: accelMagnitude * (pos.y / distance)
    };
}

// Fungsi RK4 untuk integrasi
function rungeKuttaStep(pos, vel, dt) {
    // Define derivative functions
    function dxdt(vel) {
        return vel;
    }

    function dvdt(pos) {
        const acc = computeAcceleration(pos);
        return acc;
    }

    // Calculate k1
    const k1_vx = dvdt(pos).x * dt;
    const k1_vy = dvdt(pos).y * dt;
    const k1_x = dxdt(vel).x * dt;
    const k1_y = dxdt(vel).y * dt;

    // Calculate k2
    const pos_k2 = { 
        x: pos.x + 0.5 * k1_x, 
        y: pos.y + 0.5 * k1_y 
    };
    const vel_k2 = { 
        x: vel.x + 0.5 * k1_vx, 
        y: vel.y + 0.5 * k1_vy 
    };
    const k2_vx = dvdt(pos_k2).x * dt;
    const k2_vy = dvdt(pos_k2).y * dt;
    const k2_x = dxdt(vel_k2).x * dt;
    const k2_y = dxdt(vel_k2).y * dt;

    // Calculate k3
    const pos_k3 = { 
        x: pos.x + 0.5 * k2_x, 
        y: pos.y + 0.5 * k2_y 
    };
    const vel_k3 = { 
        x: vel.x + 0.5 * k2_vx, 
        y: vel.y + 0.5 * k2_vy 
    };
    const k3_vx = dvdt(pos_k3).x * dt;
    const k3_vy = dvdt(pos_k3).y * dt;
    const k3_x = dxdt(vel_k3).x * dt;
    const k3_y = dxdt(vel_k3).y * dt;

    // Calculate k4
    const pos_k4 = { 
        x: pos.x + k3_x, 
        y: pos.y + k3_y 
    };
    const vel_k4 = { 
        x: vel.x + k3_vx, 
        y: vel.y + k3_vy 
    };
    const k4_vx = dvdt(pos_k4).x * dt;
    const k4_vy = dvdt(pos_k4).y * dt;
    const k4_x = dxdt(vel_k4).x * dt;
    const k4_y = dxdt(vel_k4).y * dt;

    // Update position and velocity
    const newPos = {
        x: pos.x + (k1_x + 2 * k2_x + 2 * k3_x + k4_x) / 6,
        y: pos.y + (k1_y + 2 * k2_y + 2 * k3_y + k4_y) / 6
    };

    const newVel = {
        x: vel.x + (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx) / 6,
        y: vel.y + (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy) / 6
    };

    return { newPos, newVel };
}

// Fungsi untuk memperbarui posisi dan kecepatan menggunakan Metode RK4
function rk4Step() {
    const { newPos, newVel } = rungeKuttaStep(position, velocity, dt);
    position = newPos;
    velocity = newVel;
    // Simpan trail
    trail.push({ x: position.x, y: position.y });
    if (trail.length > 2000) trail.shift(); // Batasi panjang trail

    // Update koordinat tampilan
    coordXSpan.textContent = position.x.toFixed(2);
    coordYSpan.textContent = position.y.toFixed(2);
}

// Fungsi untuk menggambar Jupiter dan Ganimede
function draw() {
    // Bersihkan canvas
    ctx.clearRect(0, 0, width, height);

    // Gambar Jupiter
    ctx.beginPath();
    ctx.fillStyle = '#ffcc00';
    ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2); // Diameter lebih besar untuk visibilitas
    ctx.fill();
    ctx.closePath();

    // Gambar trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    trail.forEach((point, index) => {
        const x = width / 2 + point.x * scale;
        const y = height / 2 + point.y * scale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.closePath();

    // Gambar Ganimede
    ctx.beginPath();
    ctx.fillStyle = '#00aaff';
    const xPos = width / 2 + position.x * scale;
    const yPos = height / 2 + position.y * scale;
    ctx.arc(xPos, yPos, 8, 0, Math.PI * 2); // Ukuran lebih besar untuk visibilitas
    ctx.fill();
    ctx.closePath();
}

// Fungsi Animasi
function animate() {
    for (let i = 0; i < simulationSpeed; i++) { // Langkah per frame berdasarkan kecepatan
        rk4Step();
    }
    draw();
    requestAnimationFrame(animate);
}

// Fungsi Reset Simulasi
function resetSimulation() {
    position = { ...initialPosition };
    velocity = { ...initialVelocity };
    trail = [];
    scale = 4e-7;
    simulationSpeed = 5;
    speedRange.value = simulationSpeed;
    speedValue.textContent = simulationSpeed;
    // Reset koordinat tampilan
    coordXSpan.textContent = position.x.toFixed(2);
    coordYSpan.textContent = position.y.toFixed(2);
}

// Event Listeners untuk Kontrol
zoomInBtn.addEventListener('click', () => {
    scale *= 1.2;
});

zoomOutBtn.addEventListener('click', () => {
    scale /= 1.2;
});

speedRange.addEventListener('input', (e) => {
    simulationSpeed = parseInt(e.target.value);
    speedValue.textContent = simulationSpeed;
});

resetBtn.addEventListener('click', resetSimulation);

// Mulai Animasi setelah halaman dimuat
window.onload = () => {
    // Inisialisasi koordinat tampilan
    coordXSpan.textContent = position.x.toFixed(2);
    coordYSpan.textContent = position.y.toFixed(2);
    animate();
};
