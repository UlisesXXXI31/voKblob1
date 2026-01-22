// app.js - Sistema voKblo Completo (Vercel)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';
let usuarioActual = null;

// Variables de Estado de Juego
let leccionActual = null;
let actividadActual = null;
let traducirIndice = 0;
let traducirPalabras = [];
let eleccionIndice = 0;
let eleccionPalabras = [];
let escucharIndice = 0;
let escucharPalabras = [];
let emparejarBloque = 0;
let bloquePalabrasActual = [];
let emparejarSeleccionados = [];
const BLOQUE_TAMANIO = 10;
let pronunciarIndice = 0;
let pronunciarPalabras = [];

// Sonidos
const sonidoCorrecto = new Audio("audios/correcto.mp3");
const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

document.addEventListener("DOMContentLoaded", () => {
    // ---- 1. AUTENTICACIÓN ----
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('role');

    if (!userDataStr || userRole !== 'student') {
        window.location.href = 'login.html';
        return; 
    }

    usuarioActual = JSON.parse(userDataStr);
    console.log("✅ Sesión activa:", usuarioActual.name);

    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }

    actualizarInterfazStats();
    mostrarPantalla("pantalla-lecciones");
    mostrarLecciones();

    // ---- 2. BOTONES GLOBALES ----
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    document.getElementById("btn-ir-actividades")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-actividades");
        mostrarActividades();
    });

    document.getElementById("btn-volver-lecciones")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-lecciones");
        mostrarLecciones();
    });

    document.getElementById("btn-volver-actividades")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-actividades");
    });
});

// ---- 3. ESTADÍSTICAS Y SINCRONIZACIÓN (VERCEL) ----

function actualizarInterfazStats() {
    if (!usuarioActual || !usuarioActual.stats) return;
    const stats = usuarioActual.stats;

    const puntosTexto = document.getElementById("puntos");
    if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${stats.puntos_totales || 0}`;

    const rachaNumeroEl = document.getElementById('racha-numero');
    if (rachaNumeroEl) rachaNumeroEl.textContent = stats.racha_actual || 0;

    const rachaImagenEl = document.getElementById('racha-imagen');
    if (rachaImagenEl) {
        rachaImagenEl.style.visibility = (stats.racha_actual > 0) ? 'visible' : 'hidden';
    }
}

async function registrarAcierto(puntosGanados = 1) {
    if (!usuarioActual) return;

    // Red de seguridad: si stats no existe, lo inicializamos
    if (!usuarioActual.stats) {
        usuarioActual.stats = {
            racha_actual: 0,
            puntos_totales: 0,
            puntos_semanales: 0,
            liga_actual: 'Bronce'
        };
    }

    const progressData = {
        user: usuarioActual.id || usuarioActual._id,
        lessonName: leccionActual ? leccionActual.nombre : "General",
        taskName: actividadActual || "Actividad",
        score: puntosGanados,
        completed: false 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });

        const data = await response.json();

        if (response.ok) {
            // Actualizamos racha y puntos con seguridad
            usuarioActual.stats.racha_actual = data.racha;
            usuarioActual.stats.puntos_totales = (usuarioActual.stats.puntos_totales || 0) + puntosGanados;
            
            localStorage.setItem('userData', JSON.stringify(usuarioActual));
            actualizarInterfazStats();
        }
    } catch (error) {
        console.error('❌ Error sincronizando:', error);
    }
}

// ---- 4. NAVEGACIÓN ----

function mostrarPantalla(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(p => {
        p.classList.remove('pantalla-activa');
        p.classList.add('pantalla-oculta');
    });
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) {
        pantalla.classList.remove("pantalla-oculta");
        pantalla.classList.add("pantalla-activa");
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
            mostrarListaPalabras(leccion);
        };
        container.appendChild(btn);
    });
}

function mostrarListaPalabras(leccion) {
    mostrarPantalla("pantalla-lista-palabras");
    document.getElementById("titulo-lista-leccion").textContent = `Lección: ${leccion.nombre}`;
    const container = document.getElementById("lista-palabras-container");
    container.innerHTML = "<table><thead><tr><th>Alemán</th><th>Español</th></tr></thead><tbody></tbody></table>";
    const tbody = container.querySelector("tbody");
    leccion.palabras.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.aleman}</td><td>${p.espanol}</td>`;
        tbody.appendChild(tr);
    });
}

function mostrarActividades() {
    const container = document.getElementById("actividades-container");
    if (!container) return;
    container.innerHTML = "";
    const lista = [
        {id: "traducir", n: "Traducir"},
        {id: "emparejar", n: "Emparejar"},
        {id: "eleccion-multiple", n: "Elección Múltiple"},
        {id: "escuchar", n: "Escuchar"},
        {id: "pronunciacion", n: "Pronunciación"}
    ];
    lista.forEach(act => {
        const btn = document.createElement("button");
        btn.textContent = act.n;
        btn.className = "actividad-btn";
        btn.onclick = () => iniciarActividad(act.id);
        container.appendChild(btn);
    });
}

function iniciarActividad(id) {
    actividadActual = id;
    document.getElementById("titulo-actividad").textContent = `Actividad: ${id.toUpperCase()}`;
    mostrarPantalla("pantalla-actividad");
    
    if (id === "traducir") iniciarTraducir();
    else if (id === "emparejar") iniciarEmparejar();
    else if (id === "eleccion-multiple") iniciarEleccionMultiple();
    else if (id === "escuchar") iniciarEscuchar();
    else if (id === "pronunciacion") iniciarPronunciacion();
}

// ---- 5. JUEGOS ----

// TRADUCIR
function iniciarTraducir() {
    traducirPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
    traducirIndice = 0;
    mostrarPalabraTraducir();
}

function mostrarPalabraTraducir() {
    const juego = document.getElementById("actividad-juego");
    if (traducirIndice >= traducirPalabras.length) {
        juego.innerHTML = "<h3>¡Completado!</h3>";
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
        registrarAcierto(1);
        traducirIndice++;
        setTimeout(mostrarPalabraTraducir, 800);
    } else {
        sonidoIncorrecto.play();
        feedback.textContent = `Era: ${correcta}`;
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

// Algoritmo de similitud
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

    // Configurar botón para abrir el ranking
    document.getElementById("btn-ver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-ranking");
        cargarRanking();
    });

    document.getElementById("btn-volver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-lecciones");
    });

    // Función para pedir los datos a Vercel y dibujarlos
    async function cargarRanking() {
        const ligaActual = usuarioActual.stats.liga_actual || 'Bronce';
        document.getElementById("titulo-liga-ranking").textContent = `Clasificación - Liga ${ligaActual}`;
        
        const listaUI = document.getElementById("lista-ranking");
        listaUI.innerHTML = "<tr><td colspan='3'>Cargando ranking...</td></tr>";

        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard/${ligaActual}`);
            const ranking = await response.json();

            listaUI.innerHTML = ""; // Limpiar

            ranking.forEach((alumno, index) => {
                const esYo = alumno.name === usuarioActual.name;
                const fila = document.createElement("tr");
                
                // Resaltar al alumno actual en la lista
                if (esYo) fila.style.backgroundColor = "#fff9c4"; 
                fila.style.borderBottom = "1px solid #eee";

                fila.innerHTML = `
                    <td style="padding: 10px;">${index + 1}</td>
                    <td style="padding: 10px; font-weight: ${esYo ? 'bold' : 'normal'}">
                        ${alumno.name} ${esYo ? '(Tú)' : ''}
                    </td>
                    <td style="padding: 10px;">${alumno.stats.puntos_semanales} XP</td>
                `;
                listaUI.appendChild(fila);
            });
        } catch (error) {
            console.error("Error cargando ranking:", error);
            listaUI.innerHTML = "<tr><td colspan='3'>Error al cargar el ranking.</td></tr>";
        }
    }
}
