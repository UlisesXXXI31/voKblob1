// app.js - voKblo FULL (Juegos + Rachas + Ligas + Panel Profesor)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';

document.addEventListener("DOMContentLoaded", () => {
    // ---- 1. AUTENTICACIÓN Y ESTADO ----
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('role');

    if (!userDataStr || userRole !== 'student') {
        window.location.href = 'login.html';
        return; 
    }

    const userData = JSON.parse(userDataStr);
    
    // Variables Globales de Juego
    let puntos = parseInt(localStorage.getItem('puntosTotales')) || 0;
    let puntosEnEstaSesion = 0; 
    let leccionActual = null;
    let actividadActual = null;

    // Índices de juegos
    let traducirIndice = 0, traducirPalabras = [];
    let eleccionIndice = 0, eleccionPalabras = [];
    let escucharIndice = 0, escucharPalabras = [];
    let emparejarBloque = 0, bloquePalabrasActual = [], emparejarSeleccionados = [];
    let pronunciarIndice = 0, pronunciarPalabras = [];
    const BLOQUE_TAMANIO = 10;

    // Elementos DOM
    const puntosTexto = document.getElementById("puntos");
    const rachaNumeroEl = document.getElementById('racha-numero');
    const rachaImagenEl = document.getElementById('racha-imagen');
    const ligaNombreEl = document.getElementById('liga-nombre');
    const juegoContainer = document.getElementById("actividad-juego");

    // Sonidos
    const sonidoCorrecto = new Audio("audios/correcto.mp3");
    const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

    // Inicializar App
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }
    actualizarInterfazStats();
    mostrarLecciones();

    // ---- 2. COMUNICACIÓN CON VERCEL (RACHAS Y PUNTOS) ----

    function actualizarInterfazStats() {
        if (!userData.stats) userData.stats = { racha_actual: 0, puntos_totales: 0, liga_actual: 'Bronce' };
        
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
        if (rachaNumeroEl) rachaNumeroEl.textContent = userData.stats.racha_actual || 0;
        if (ligaNombreEl) ligaNombreEl.textContent = userData.stats.liga_actual || 'Bronce';
        if (rachaImagenEl) {
            rachaImagenEl.style.visibility = (userData.stats.racha_actual > 0) ? 'visible' : 'hidden';
        }
    }

    async function registrarAcierto(puntosGanados = 1) {
        sonidoCorrecto.play();
        puntos += puntosGanados;
        puntosEnEstaSesion += puntosGanados;
        actualizarPuntos();
        localStorage.setItem('puntosTotales', puntos.toString());

        try {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: userData.id || userData._id,
                    score: puntosGanados,
                    lessonName: leccionActual ? leccionActual.nombre : "General",
                    taskName: actividadActual,
                    completed: false
                })
            });
            const data = await response.json();
            if (response.ok) {
                userData.stats.racha_actual = data.racha;
                localStorage.setItem('userData', JSON.stringify(userData));
                actualizarInterfazStats();
            }
        } catch (e) { console.error("Error racha:", e); }
    }

    async function enviarPuntuacionFinalProfesor() {
        if (puntosEnEstaSesion === 0) return alert("No hay puntos nuevos.");
        try {
            await fetch(`${API_BASE_URL}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: userData.id || userData._id,
                    score: 0,
                    lessonName: leccionActual ? leccionActual.nombre : "Lección",
                    taskName: actividadActual,
                    completed: true 
                })
            });
            alert("✅ ¡Guardado para el profesor!");
            puntosEnEstaSesion = 0;
        } catch (e) { alert("Error al guardar."); }
    }

    // ---- 3. RANKING ----
    async function cargarRanking() {
        const liga = userData.stats?.liga_actual || 'Bronce';
        const listaUI = document.getElementById("lista-ranking");
        listaUI.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";
        try {
            const res = await fetch(`${API_BASE_URL}/leaderboard/${liga}`);
            const ranking = await res.json();
            listaUI.innerHTML = "";
            ranking.forEach((al, i) => {
                const esYo = al.name === userData.name;
                listaUI.innerHTML += `<tr style="${esYo ? 'background:#fff9c4' : ''}">
                    <td>${i+1}</td><td>${al.name} ${esYo ? '(Tú)' : ''}</td><td>${al.stats.puntos_semanales} XP</td>
                </tr>`;
            });
        } catch (e) { console.error("Error ranking"); }
    }

    // ---- 4. NAVEGACIÓN ----
    function mostrarPantalla(id) {
        document.querySelectorAll('.pantalla').forEach(p => {
            p.classList.remove('pantalla-activa');
            p.classList.add('pantalla-oculta');
        });
        document.getElementById(id)?.classList.replace('pantalla-oculta', 'pantalla-activa');
    }

    function actualizarPuntos() {
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
    }

    // ---- 5. JUEGOS ----

    // TRADUCIR
    function iniciarTraducir() {
        traducirPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
        traducirIndice = 0;
        mostrarPalabraTraducir();
    }

    function mostrarPalabraTraducir() {
        if (traducirIndice >= traducirPalabras.length) {
            juegoContainer.innerHTML = "<h3>🎉 ¡Completado! Dale a Guardar Puntos.</h3>";
            return;
        }
        const p = traducirPalabras[traducirIndice];
        juegoContainer.innerHTML = `
            <p>Traduce: <strong>${p.aleman}</strong></p>
            <input type="text" id="input-traducir" autocomplete="off">
            <button id="btn-verificar">Verificar</button>
            <div id="feedback"></div>
        `;
        document.getElementById("btn-verificar").onclick = verificarTraducir;
    }

    function verificarTraducir() {
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
    }

    // ELECCIÓN MÚLTIPLE
    function iniciarEleccionMultiple() {
        eleccionPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
        eleccionIndice = 0;
        mostrarEleccion();
    }

    function mostrarEleccion() {
        if (eleccionIndice >= eleccionPalabras.length) {
            juegoContainer.innerHTML = "<h3>¡Completado!</h3>";
            return;
        }
        const p = eleccionPalabras[eleccionIndice];
        const opciones = [p.espanol];
        while(opciones.length < 4) {
            let azar = leccionActual.palabras[Math.floor(Math.random()*leccionActual.palabras.length)].espanol;
            if(!opciones.includes(azar)) opciones.push(azar);
        }
        opciones.sort(() => Math.random() - 0.5);
        juegoContainer.innerHTML = `<p>¿Qué significa <strong>${p.aleman}</strong>?</p>`;
        opciones.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.className = "btn-opcion";
            btn.onclick = () => {
                if(opt === p.espanol) {
                    registrarAcierto(1);
                    eleccionIndice++;
                    mostrarEleccion();
                } else { sonidoIncorrecto.play(); }
            };
            juegoContainer.appendChild(btn);
        });
    }

    // EMPAREJAR
    function iniciarEmparejar() {
        emparejarBloque = 0;
        cargarBloqueEmparejar();
    }

    function cargarBloqueEmparejar() {
        juegoContainer.innerHTML = '<div id="col-aleman"></div><div id="col-espanol"></div>';
        const inicio = emparejarBloque * BLOQUE_TAMANIO;
        const fin = Math.min(inicio + BLOQUE_TAMANIO, leccionActual.palabras.length);
        bloquePalabrasActual = leccionActual.palabras.slice(inicio, fin);
        if (bloquePalabrasActual.length === 0) {
            juegoContainer.innerHTML = "<h3>¡Completado!</h3>";
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
        const pArr = leccionActual.palabras;
        const esCorrecto = pArr.some(p => (p.aleman === s1.texto && p.espanol === s2.texto) || (p.espanol === s1.texto && p.aleman === s2.texto));
        if (esCorrecto && s1.tipo !== s2.tipo) {
            registrarAcierto(1);
            s1.btn.classList.add("acertada"); s2.btn.classList.add("acertada");
            bloquePalabrasActual = bloquePalabrasActual.filter(p => p.aleman !== s1.texto && p.aleman !== s2.texto);
            if (bloquePalabrasActual.length === 0) {
                emparejarBloque++;
                setTimeout(cargarBloqueEmparejar, 800);
            }
        } else {
            sonidoIncorrecto.play();
            s1.btn.classList.remove("seleccionada"); s2.btn.classList.remove("seleccionada");
        }
        emparejarSeleccionados = [];
    }

    // ESCUCHAR
    function iniciarEscuchar() {
        escucharPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
        escucharIndice = 0;
        mostrarEscuchar();
    }

    function mostrarEscuchar() {
        if (escucharIndice >= escucharPalabras.length) {
            juegoContainer.innerHTML = "<
