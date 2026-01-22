// app.js - Sistema voKblo (Rachas + Guardado para Profesor)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';
let usuarioActual = null;

// Variables de Estado
let leccionActual = null;
let actividadActual = null;
let puntosEnEstaSesion = 0; // Puntos ganados desde el último "Guardar"

// Variables de Juego
let traducirIndice = 0, traducirPalabras = [];
let eleccionIndice = 0, eleccionPalabras = [];
let escucharIndice = 0, escucharPalabras = [];
let emparejarBloque = 0, bloquePalabrasActual = [], emparejarSeleccionados = [];
const BLOQUE_TAMANIO = 10;
let pronunciarIndice = 0, pronunciarPalabras = [];

// Sonidos
const sonidoCorrecto = new Audio("audios/correcto.mp3");
const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

document.addEventListener("DOMContentLoaded", () => {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) { window.location.href = 'login.html'; return; }

    usuarioActual = JSON.parse(userDataStr);
    if (!usuarioActual.stats) {
        usuarioActual.stats = { racha_actual: 0, puntos_totales: 0, liga_actual: 'Bronce' };
    }

    const appContainer = document.getElementById("app-container");
    if (appContainer) appContainer.classList.add('pantalla-activa');

    actualizarInterfazStats();
    mostrarLecciones();

    // ---- CONFIGURACIÓN DE BOTONES ----
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Restauramos el botón de Guardar Puntos para el Profesor
    document.getElementById("btn-guardar-puntos")?.addEventListener("click", () => {
        enviarPuntuacionFinalProfesor();
    });

    document.getElementById("btn-ver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-ranking");
        cargarRanking();
    });

    // ... (resto de botones de navegación)
});

// ---- 1. LÓGICA DE PUNTOS Y RACHAS ----

function actualizarInterfazStats() {
    const stats = usuarioActual.stats;
    document.getElementById("puntos").textContent = `Puntos totales: ${stats.puntos_totales || 0}`;
    document.getElementById('racha-numero').textContent = stats.racha_actual || 0;
    document.getElementById('liga-nombre').textContent = stats.liga_actual || 'Bronce';
    const fuego = document.getElementById('racha-imagen');
    if (fuego) fuego.style.visibility = (stats.racha_actual > 0) ? 'visible' : 'hidden';
}

// Sincronización rápida (para la racha y XP inmediata)
async function registrarAciertoTemporal() {
    sonidoCorrecto.play();
    puntosEnEstaSesion++; // Acumulamos para el profesor

    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: usuarioActual.id || usuarioActual._id,
                score: 1,
                lessonName: leccionActual ? leccionActual.nombre : "General",
                taskName: actividadActual,
                completed: false // Aún no hemos dado al botón de guardar
            })
        });
        const data = await response.json();
        if (response.ok) {
            usuarioActual.stats.racha_actual = data.racha;
            usuarioActual.stats.puntos_totales += 1;
            localStorage.setItem('userData', JSON.stringify(usuarioActual));
            actualizarInterfazStats();
        }
    } catch (e) { console.error("Error racha:", e); }
}

// ENVÍO FINAL (Lo que el profesor ve en su panel)
async function enviarPuntuacionFinalProfesor() {
    if (puntosEnEstaSesion === 0) {
        alert("No hay puntos nuevos para guardar.");
        return;
    }

    const btn = document.getElementById("btn-guardar-puntos");
    btn.textContent = "Guardando...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: usuarioActual.id || usuarioActual._id,
                score: 0, // Los puntos ya se sumaron de 1 en 1, aquí solo marcamos final
                lessonName: leccionActual ? leccionActual.nombre : "Lección",
                taskName: actividadActual || "Actividad",
                completed: true // <--- ESTO activa la visibilidad en el panel del profesor
            })
        });

        if (response.ok) {
            alert(`¡Progreso guardado! El profesor ya puede ver tu actividad en ${actividadActual}.`);
            puntosEnEstaSesion = 0; // Reiniciamos contador de sesión
            btn.textContent = "Guardar Puntos";
            btn.disabled = false;
        }
    } catch (e) {
        alert("Error al conectar con el servidor.");
        btn.disabled = false;
    }
}

// ---- 2. JUEGOS (INTEGRADOS) ----

// En cada juego, cuando el alumno acierta, llamamos a registrarAciertoTemporal()

window.verificarTraducir = () => {
    const input = document.getElementById("input-traducir");
    const correcta = traducirPalabras[traducirIndice].espanol.toLowerCase();
    if (input.value.trim().toLowerCase() === correcta) {
        registrarAciertoTemporal(); // Sube 1 punto y racha
        traducirIndice++;
        setTimeout(mostrarPalabraTraducir, 800);
    } else {
        sonidoIncorrecto.play();
    }
};

// ... (Repetir la misma lógica de llamar a registrarAciertoTemporal() en los otros juegos)

// ---- 3. RANKING Y NAVEGACIÓN ----

async function cargarRanking() {
    const liga = usuarioActual.stats.liga_actual || 'Bronce';
    const listaUI = document.getElementById("lista-ranking");
    try {
        const res = await fetch(`${API_BASE_URL}/leaderboard/${liga}`);
        const ranking = await res.json();
        listaUI.innerHTML = "";
        ranking.forEach((al, i) => {
            const esYo = al.name === usuarioActual.name;
            listaUI.innerHTML += `<tr style="${esYo ? 'background:#fff9c4' : ''}">
                <td>${i+1}</td><td>${al.name}</td><td>${al.stats.puntos_semanales} XP</td>
            </tr>`;
        });
    } catch (e) { console.error("Error ranking"); }
}

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.replace('pantalla-activa', 'pantalla-oculta'));
    document.getElementById(id).classList.replace('pantalla-oculta', 'pantalla-activa');
}

// ... (Resto de funciones de mostrarLecciones, mostrarActividades, etc.)
