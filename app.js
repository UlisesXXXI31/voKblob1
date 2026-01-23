// app.js - voKblo Sistema Híbrido (Rachas + Panel Profesor)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';
let usuarioActual = null;

// Variables de Juego
let leccionActual = null;
let actividadActual = null;
let puntosEnEstaSesion = 0; 
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
    console.log("🚀 App iniciada");

    // 1. Verificación de Usuario
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        console.log("⚠️ No hay sesión, redirigiendo a login...");
        window.location.href = 'login.html';
        return;
    }

    usuarioActual = JSON.parse(userDataStr);
    
    // Seguridad para estadísticas
    if (!usuarioActual.stats) {
        usuarioActual.stats = { racha_actual: 0, puntos_totales: 0, liga_actual: 'Bronce' };
    }

    // 2. Mostrar Contenedor Principal (Quitar pantalla en blanco)
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }

    // 3. Inicializar Interfaz
    actualizarInterfazStats();
    mostrarPantalla("pantalla-lecciones");
    
    // Verificar si existe el archivo de palabras
    if (typeof datosLecciones !== 'undefined') {
        mostrarLecciones();
    } else {
        console.error("❌ Error: No se encuentra 'datosLecciones'. Revisa palabras.js");
    }

    // 4. Configurar Eventos de Botones
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    document.getElementById("btn-guardar-puntos")?.addEventListener("click", enviarPuntuacionFinalProfesor);
    
    document.getElementById("btn-ver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-ranking");
        cargarRanking();
    });

    document.getElementById("btn-volver-lecciones")?.addEventListener("click", () => mostrarPantalla("pantalla-lecciones"));
    document.getElementById("btn-volver-actividades")?.addEventListener("click", () => mostrarPantalla("pantalla-actividades"));
    document.getElementById("btn-ir-actividades")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-actividades");
        mostrarActividades();
    });
    document.getElementById("btn-volver-lista")?.addEventListener("click", () => mostrarPantalla("pantalla-lecciones"));
});

// --- FUNCIONES DE ESTADÍSTICAS ---

function actualizarInterfazStats() {
    if (!usuarioActual) return;
    const stats = usuarioActual.stats;
    
    const puntosTexto = document.getElementById("puntos");
    const rachaTexto = document.getElementById("racha-numero");
    const ligaTexto = document.getElementById("liga-nombre");
    const fuegoImg = document.getElementById("racha-imagen");

    if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${stats.puntos_totales || 0}`;
    if (rachaTexto) rachaTexto.textContent = stats.racha_actual || 0;
    if (ligaTexto) ligaTexto.textContent = stats.liga_actual || 'Bronce';
    if (fuegoImg) fuegoImg.style.visibility = (stats.racha_actual > 0) ? 'visible' : 'hidden';
}

// Sincronización rápida (Rachas)
async function registrarAciertoTemporal() {
    sonidoCorrecto.play();
    puntosEnEstaSesion++;

    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: usuarioActual.id || usuarioActual._id,
                score: 1,
                lessonName: leccionActual ? leccionActual.nombre : "General",
                taskName: actividadActual,
                completed: false
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

// Envío para Panel de Profesor
async function enviarPuntuacionFinalProfesor() {
    if (puntosEnEstaSesion === 0) {
        alert("No hay puntos nuevos para guardar.");
        return;
    }
    const btn = document.getElementById("btn-guardar-puntos");
    btn.textContent = "Guardando...";
    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: usuarioActual.id || usuarioActual._id,
                score: 0,
                lessonName: leccionActual ? leccionActual.nombre : "Lección",
                taskName: actividadActual || "Actividad",
                completed: true 
            })
        });
        if (response.ok) {
            alert("✅ ¡Progreso enviado al profesor!");
            puntosEnEstaSesion = 0;
        }
    } catch (e) { alert("Error de conexión."); }
    btn.textContent = "Guardar Puntos";
}

// --- NAVEGACIÓN ---

function mostrarPantalla(id) {
    const pantallas = document.querySelectorAll('.pantalla');
    pantallas.forEach(p => {
        p.classList.remove('pantalla-activa');
        p.classList.add('pantalla-oculta');
    });
    const pantalla = document.getElementById(id);
    if (pantalla) {
        pantalla.classList.remove('pantalla-oculta');
        pantalla.classList.add('pantalla-activa');
    }
}

function mostrarLecciones() {
    const container = document.getElementById("lecciones-container");
    if (!container) return;
    container.innerHTML = "";
    datosLecciones.lecciones.forEach(leccion => {
        const btn = document.createElement("button");
        btn.textContent = leccion.nombre;
        btn.className = "leccion-btn";
        btn.onclick = () => {
            leccionActual = leccion;
            mostrarPantalla("pantalla-lista-palabras");
            mostrarListaPalabras(leccion);
        };
        container.appendChild(btn);
    });
}

function mostrarListaPalabras(leccion) {
    document.getElementById("titulo-lista-leccion").textContent = leccion.nombre;
    const container = document.getElementById("lista-palabras-container");
    let html = "<table><thead><tr><th>Alemán</th><th>Español</th></tr></thead><tbody>";
    leccion.palabras.forEach(p => {
        html += `<tr><td>${p.aleman}</td><td>${p.espanol}</td></tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
}

function mostrarActividades() {
    const container = document.getElementById("actividades-container");
    container.innerHTML = "";
    const lista = ["traducir", "emparejar", "eleccion-multiple", "escuchar", "pronunciacion"];
    lista.forEach(id => {
        const btn = document.createElement("button");
        btn.textContent = id.replace("-", " ").toUpperCase();
        btn.className = "actividad-btn";
        btn.onclick = () => iniciarActividad(id);
        container.appendChild(btn);
    });
}

function iniciarActividad(id) {
    actividadActual = id;
    document.getElementById("titulo-actividad").textContent = id.toUpperCase();
    mostrarPantalla("pantalla-actividad");
    const juego = document.getElementById("actividad-juego");
    juego.innerHTML = "";

    if (id === "traducir") iniciarTraducir();
    else if (id === "emparejar") iniciarEmparejar();
    else if (id === "eleccion-multiple") iniciarEleccionMultiple();
    else if (id === "escuchar") iniciarEscuchar();
    else if (id === "pronunciacion") iniciarPronunciacion();
}

// --- JUEGOS ---

function iniciarTraducir() {
    traducirPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
    traducirIndice = 0;
    mostrarPalabraTraducir();
}

function mostrarPalabraTraducir() {
    const juego = document.getElementById("actividad-juego");
    if (traducirIndice >= traducirPalabras.length) {
        juego.innerHTML = "<h3>🎉 ¡Lección completada! Dale a Guardar Puntos.</h3>";
        return;
    }
    const p = traducirPalabras[traducirIndice];
    juego.innerHTML = `
        <p>Traduce: <strong>${p.aleman}</strong></p>
        <input type="text" id="input-traducir" autocomplete="off">
        <button onclick="verificarTraducir()">Verificar</button>
        <div id="feedback"></div>
    `;
    document.getElementById("input-traducir").focus();
}

window.verificarTraducir = () => {
    const input = document.getElementById("input-traducir");
    const feedback = document.getElementById("feedback");
    const correcta = traducirPalabras[traducirIndice].espanol.toLowerCase();
    if (input.value.trim().toLowerCase() === correcta) {
        registrarAciertoTemporal();
        traducirIndice++;
        setTimeout(mostrarPalabraTraducir, 800);
    } else {
        sonidoIncorrecto.play();
        feedback.textContent = `Error. Era: ${correcta}`;
        feedback.style.color = "red";
    }
};

// ELECCIÓN MÚLTIPLE
function iniciarEleccionMultiple() {
    eleccionPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
    eleccionIndice = 0;
    mostrarEleccion();
}

function mostrarEleccion() {
    const juego = document.getElementById("actividad-juego");
    if (eleccionIndice >= eleccionPalabras.length) {
        juego.innerHTML = "<h3>¡Completado!</h3>";
        return;
    }
    const p = eleccionPalabras[eleccionIndice];
    const opciones = [p.espanol];
    while(opciones.length < 4) {
        let azar = leccionActual.palabras[Math.floor(Math.random()*leccionActual.palabras.length)].espanol;
        if(!opciones.includes(azar)) opciones.push(azar);
    }
    opciones.sort(() => Math.random() - 0.5);
    juego.innerHTML = `<p>¿Qué significa <strong>${p.aleman}</strong>?</p>`;
    opciones.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.className = "btn-opcion";
        btn.onclick = () => {
            if(opt === p.espanol) {
                registrarAcierto(1);
                eleccionIndice++;
                mostrarEleccion();
            } else {
                sonidoIncorrecto.play();
            }
        };
        juego.appendChild(btn);
    });
}

// ESCUCHAR
function iniciarEscuchar() {
    escucharPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
    escucharIndice = 0;
    mostrarEscuchar();
}

function mostrarEscuchar() {
    const juego = document.getElementById("actividad-juego");
    if (escucharIndice >= escucharPalabras.length) {
        juego.innerHTML = "<h3>¡Completado!</h3>";
        return;
    }
    const p = escucharPalabras[escucharIndice];
    juego.innerHTML = `
        <button onclick="reproducir('${p.aleman}')">🔊 Escuchar</button>
        <input type="text" id="input-escuchar" placeholder="Escribe en alemán">
        <button onclick="verificarEscuchar()">Verificar</button>
    `;
}

window.reproducir = (txt) => {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'de-DE';
    window.speechSynthesis.speak(u);
};

window.verificarEscuchar = () => {
    const res = document.getElementById("input-escuchar").value.trim().toLowerCase();
    const correcta = escucharPalabras[escucharIndice].aleman.toLowerCase();
    if(res === correcta) {
        registrarAcierto(1);
        escucharIndice++;
        mostrarEscuchar();
    } else {
        sonidoIncorrecto.play();
    }
};

// EMPAREJAR
function iniciarEmparejar() {
    emparejarBloque = 0;
    cargarBloqueEmparejar();
}

function cargarBloqueEmparejar() {
    const juego = document.getElementById("actividad-juego");
    juego.innerHTML = '<div id="col-aleman"></div><div id="col-espanol"></div>';
    const inicio = emparejarBloque * BLOQUE_TAMANIO;
    const fin = Math.min(inicio + BLOQUE_TAMANIO, leccionActual.palabras.length);
    bloquePalabrasActual = leccionActual.palabras.slice(inicio, fin);
    if (bloquePalabrasActual.length === 0) {
        juego.innerHTML = "<h3>¡Completado!</h3>";
        return;
    }
    const alemanas = [...bloquePalabrasActual].sort(() => Math.random() - 0.5);
    const espanolas = [...bloquePalabrasActual].sort(() => Math.random() - 0.5);
    alemanas.forEach(p => crearBotonEmparejar(p.aleman, "aleman", "col-aleman"));
    espanolas.forEach(p => crearBotonEmparejar(p.espanol, "espanol", "col-espanol"));
}

function crearBotonEmparejar(texto, tipo, colId) {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.className = "btn-palabra";
    btn.onclick = () => {
        if (btn.classList.contains("acertada")) return;
        btn.classList.toggle("seleccionada");
        emparejarSeleccionados.push({texto, tipo, btn});
        if (emparejarSeleccionados.length === 2) verificarPareja();
    };
    document.getElementById(colId).appendChild(btn);
}

function verificarPareja() {
    const [s1, s2] = emparejarSeleccionados;
    const esCorrecto = bloquePalabrasActual.some(p => 
        (p.aleman === s1.texto && p.espanol === s2.texto) || (p.espanol === s1.texto && p.aleman === s2.texto)
    );
    if (esCorrecto && s1.tipo !== s2.tipo) {
        registrarAcierto(1);
        s1.btn.classList.add("acertada");
        s2.btn.classList.add("acertada");
        bloquePalabrasActual = bloquePalabrasActual.filter(p => p.aleman !== s1.texto && p.aleman !== s2.texto);
        if (bloquePalabrasActual.length === 0) {
            emparejarBloque++;
            setTimeout(cargarBloqueEmparejar, 800);
        }
    } else {
        sonidoIncorrecto.play();
        s1.btn.classList.remove("seleccionada");
        s2.btn.classList.remove("seleccionada");
    }
    emparejarSeleccionados = [];
}

// PRONUNCIACIÓN
function iniciarPronunciacion() {
    pronunciarPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
    pronunciarIndice = 0;
    mostrarPalabraPronunciacion();
}

function mostrarPalabraPronunciacion() {
    const juego = document.getElementById("actividad-juego");
    if (pronunciarIndice >= pronunciarPalabras.length) {
        juego.innerHTML = "<h3>¡Completado!</h3>";
        return;
    }
    const p = pronunciarPalabras[pronunciarIndice];
    juego.innerHTML = `
        <p>Pronuncia: <strong style="font-size:1.5rem;">${p.aleman}</strong></p>
        <button onclick="reproducir('${p.aleman}')">🔊 Escuchar ejemplo</button>
        <button id="btn-hablar" style="background:#ff9800; color:white;">🎤 Toca para hablar</button>
        <div id="feedback-voz"></div>
    `;
    document.getElementById("btn-hablar").onclick = () => escucharVoz(p.aleman);
}

function escucharVoz(palabraCorrecta) {
    const feedback = document.getElementById("feedback-voz");
    if (!('webkitSpeechRecognition' in window)) {
        alert("Navegador no soportado"); return;
    }
    const rec = new webkitSpeechRecognition();
    rec.lang = 'de-DE';
    feedback.textContent = "Escuchando...";
    rec.start();

    rec.onresult = (e) => {
        const trans = e.results[0][0].transcript.toLowerCase();
        const score = 1 - (levenshtein(trans, palabraCorrecta.toLowerCase()) / Math.max(trans.length, palabraCorrecta.length));
        
        if (score > 0.7) {
            feedback.textContent = "¡Muy bien!";
            registrarAcierto(1);
            pronunciarIndice++;
            setTimeout(mostrarPalabraPronunciacion, 1200);
        } else {
            sonidoIncorrecto.play();
            feedback.textContent = `Dijiste: "${trans}". Intenta de nuevo.`;
        }
    };
    rec.onerror = () => feedback.textContent = "Error al escuchar.";
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}


// RANKING
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
