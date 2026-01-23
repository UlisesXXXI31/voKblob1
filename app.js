// app.js - voKblo (Original con Integración de Ligas y Ranking)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';

document.addEventListener("DOMContentLoaded", () => {
    // ---- LÓGICA DE AUTENTICACIÓN (ORIGINAL) ----
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    const userDataStr = localStorage.getItem('userData');

    if (!token || userRole !== 'student' || !userDataStr) {
        window.location.href = 'login.html';
        return; 
    }

    // Cargamos los datos del usuario (que ya traen las stats de racha y liga desde el login)
    let usuarioActual = JSON.parse(userDataStr);
    
    // Seguridad: Si el usuario no tiene stats, las creamos
    if (!usuarioActual.stats) {
        usuarioActual.stats = { racha_actual: 0, puntos_totales: 0, liga_actual: 'Bronce', puntos_semanales: 0 };
    }

    // A partir de aquí, el usuario está autenticado como alumno
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }
    
    // ---- VARIABLES GLOBALES (ORIGINALES) ----
    let puntos = parseInt(localStorage.getItem('puntosTotales')) || 0;
    let puntosUltimaSesion = parseInt(localStorage.getItem('puntosUltimaSesionGuardados')) || 0;
    let leccionActual = null;
    let actividadActual = null;
    let puntosEnEstaSesion = 0; // Para el panel del profesor

    // Elementos del DOM (ORIGINALES + LIGAS)
    const puntosTexto = document.getElementById("puntos");
    const rachaNumeroEl = document.getElementById('racha-numero');
    const rachaImagenEl = document.getElementById('racha-imagen');
    const ligaNombreEl = document.getElementById('liga-nombre');
    
    const leccionesContainer = document.getElementById("lecciones-container");
    const actividadesContainer = document.getElementById("actividades-container");
    const actividadJuego = document.getElementById("actividad-juego");
    const tituloLeccion = document.getElementById("titulo-leccion");
    const tituloActividad = document.getElementById("titulo-actividad");
    const btnReiniciarPuntos = document.getElementById("btn-reiniciar-puntos");
    const btnVerHistorial = document.getElementById("btn-ver-historial");
    const btnGuardarPuntos = document.getElementById("btn-guardar-puntos");
    const btnLogout = document.getElementById('btn-logout');

    // Sonidos (ORIGINALES)
    const sonidoCorrcto = new Audio("audios/correcto.mp3");
    const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

    // ---- FUNCIÓN NUEVA: ACTUALIZAR INTERFAZ DE LIGAS ----
    function actualizarInterfazLigas() {
        if (!usuarioActual.stats) return;
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
        if (rachaNumeroEl) rachaNumeroEl.textContent = usuarioActual.stats.racha_actual || 0;
        if (ligaNombreEl) ligaNombreEl.textContent = usuarioActual.stats.liga_actual || 'Bronce';
        if (rachaImagenEl) {
            rachaImagenEl.style.visibility = (usuarioActual.stats.racha_actual > 0) ? 'visible' : 'hidden';
        }
    }
    actualizarInterfazLigas();

    // ---- FUNCIÓN NUEVA: REGISTRAR ACIERTO EN SERVIDOR (RACHA) ----
    async function registrarAciertoServidor(pts = 1) {
        try {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: usuarioActual.id || usuarioActual._id,
                    score: pts,
                    lessonName: leccionActual ? leccionActual.nombre : "General",
                    taskName: actividadActual,
                    completed: false
                })
            });
            const data = await response.json();
            if (response.ok) {
                usuarioActual.stats.racha_actual = data.racha;
                localStorage.setItem('userData', JSON.stringify(usuarioActual));
                actualizarInterfazLigas();
            }
        } catch (e) { console.error("Error sincronizando racha:", e); }
    }

    // ---- FUNCIÓN NUEVA: GUARDAR PUNTOS PARA PROFESOR ----
    async function guardarPuntuacionEnHistorial() {
        if (puntosEnEstaSesion === 0) {
            alert("No hay puntos nuevos para guardar.");
            return;
        }
        btnGuardarPuntos.textContent = "Guardando...";
        try {
            await fetch(`${API_BASE_URL}/progress`, {
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
            alert("✅ ¡Progreso enviado al profesor!");
            puntosEnEstaSesion = 0;
        } catch (e) { alert("Error al guardar."); }
        btnGuardarPuntos.textContent = "Guardar Puntos";
    }

    // ---- RANKING / CLASIFICACIÓN ----
    async function cargarRanking() {
        const liga = usuarioActual.stats.liga_actual || 'Bronce';
        const listaUI = document.getElementById("lista-ranking");
        if (!listaUI) return;
        listaUI.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";
        try {
            const res = await fetch(`${API_BASE_URL}/leaderboard/${liga}`);
            const ranking = await res.json();
            listaUI.innerHTML = "";
            ranking.forEach((al, i) => {
                const esYo = al.name === usuarioActual.name;
                listaUI.innerHTML += `<tr style="${esYo ? 'background:#fff9c4' : ''}">
                    <td>${i+1}</td><td>${al.name} ${esYo ? '(Tú)' : ''}</td><td>${al.stats.puntos_semanales} XP</td>
                </tr>`;
            });
        } catch (e) { console.error("Error ranking:", e); }
    }

    document.getElementById("btn-ver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-ranking");
        cargarRanking();
    });

    document.getElementById("btn-volver-ranking")?.addEventListener("click", () => mostrarPantalla("pantalla-lecciones"));

    // ---- SERVICE WORKER (ORIGINAL) ----
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/vokblob1/service-worker.js', { scope: '/vokblo1/' })
                .then(reg => console.log('✅ SW ok')).catch(err => console.log('❌ SW error', err));
            });
        }
    }
    registerServiceWorker();

    // ---- FUNCIONES DE NAVEGACIÓN (ORIGINALES) ----
    function ocultarTodasLasPantallas() {
        document.querySelectorAll('.pantalla').forEach(p => {
            p.classList.remove('pantalla-activa');
            p.classList.add('pantalla-oculta');
        });
    }

    function mostrarPantalla(idPantalla) {
        ocultarTodasLasPantallas();
        const pantalla = document.getElementById(idPantalla);
        if (pantalla) {
            pantalla.classList.remove("pantalla-oculta");
            pantalla.classList.add("pantalla-activa");
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // --- LECCIONES Y ACTIVIDADES (ORIGINALES) ---
    function mostrarLecciones() {
        if (!leccionesContainer) return;
        leccionesContainer.innerHTML = "";
        datosLecciones.lecciones.forEach(leccion => {
            const btn = document.createElement("button");
            btn.textContent = leccion.nombre;
            btn.className = "leccion-btn";
            btn.onclick = () => { leccionActual = leccion; mostrarListaPalabras(leccion); };
            leccionesContainer.appendChild(btn);
        });
    }

    function mostrarListaPalabras(leccion) {
        mostrarPantalla("pantalla-lista-palabras");
        const titulo = document.getElementById("titulo-lista-leccion");
        const container = document.getElementById("lista-palabras-container");
        if (titulo) titulo.textContent = `Palabras: ${leccion.nombre}`;
        if (container) {
            container.innerHTML = "<table><thead><tr><th>Alemán</th><th>Español</th></tr></thead><tbody>";
            leccion.palabras.forEach(par => {
                container.querySelector("tbody").innerHTML += `<tr><td>${par.aleman}</td><td>${par.espanol}</td></tr>`;
            });
            container.innerHTML += "</tbody></table>";
        }
    }

    function mostrarActividades() {
        if (!actividadesContainer) return;
        actividadesContainer.innerHTML = "";
        ["traducir", "emparejar", "eleccion-multiple", "escuchar", "pronunciacion"].forEach(id => {
            const btn = document.createElement("button");
            btn.textContent = id.replace("-", " ").toUpperCase();
            btn.className = "actividad-btn";
            btn.onclick = () => iniciarActividad(id);
            actividadesContainer.appendChild(btn);
        });
    }

    function iniciarActividad(id) {
        actividadActual = id;
        document.getElementById("titulo-actividad").textContent = id.toUpperCase();
        mostrarPantalla("pantalla-actividad");
        if (id === "traducir") iniciarTraducir();
        else if (id === "emparejar") iniciarEmparejar();
        else if (id === "eleccion-multiple") iniciarEleccionMultiple();
        else if (id === "escuchar") iniciarEscuchar();
        else if (id === "pronunciacion") iniciarPronunciar(leccionActual);
    }

    // --- LÓGICA DE JUEGOS (ORIGINAL + INYECCIÓN) ---

    function actualizarPuntos() {
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
    }

    // 1. TRADUCIR
    let traducirPalabras = [], traducirIndice = 0;
    function iniciarTraducir() {
        traducirPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
        traducirIndice = 0; mostrarPalabraTraducir();
    }
    function mostrarPalabraTraducir() {
        if (traducirIndice >= traducirPalabras.length) {
            actividadJuego.innerHTML = "<p>¡Has terminado!</p>"; return;
        }
        const p = traducirPalabras[traducirIndice];
        actividadJuego.innerHTML = `
            <p><strong>Alemán:</strong> ${p.aleman}</p>
            <input type="text" id="input-traducir" autocomplete="off">
            <button onclick="verificarTraducir()">Verificar</button>
            <div id="mensaje-feedback"></div>
        `;
        document.getElementById("input-traducir").focus();
    }
    window.verificarTraducir = () => {
        const input = document.getElementById("input-traducir");
        const feedback = document.getElementById("mensaje-feedback");
        const correcta = traducirPalabras[traducirIndice].espanol.toLowerCase();
        if (input.value.trim().toLowerCase() === correcta) {
            feedback.textContent = "¡Correcto!";
            sonidoCorrcto.play();
            puntos++; puntosEnEstaSesion++;
            registrarAciertoServidor(1);
            traducirIndice++; actualizarPuntos();
            localStorage.setItem('puntosTotales', puntos.toString());
            setTimeout(mostrarPalabraTraducir, 1000);
        } else {
            sonidoIncorrecto.play(); feedback.textContent = `Error: era ${correcta}`;
            puntos = Math.max(0, puntos - 1); actualizarPuntos();
        }
    };

    // 2. EMPAREJAR
    let emparejarPalabras = [], emparejarSeleccionados = [], emparejarBloque = 0, bloquePalabrasActual = [];
    function iniciarEmparejar() { emparejarPalabras = [...leccionActual.palabras]; emparejarBloque = 0; cargarBloqueEmparejar(); }
    function cargarBloqueEmparejar() {
        actividadJuego.innerHTML = '<div id="palabras-aleman" class="contenedor-palabras"></div><div id="palabras-espanol" class="contenedor-palabras"></div><div id="mensaje-feedback"></div>';
        const inicio = emparejarBloque * BLOQUE_TAMANIO;
        const fin = Math.min(inicio + BLOQUE_TAMANIO, emparejarPalabras.length);
        bloquePalabrasActual = emparejarPalabras.slice(inicio, fin);
        const alem = bloquePalabrasActual.map(p => p.aleman);
        const esp = bloquePalabrasActual.map(p => p.espanol).sort(() => Math.random() - 0.5);
        alem.forEach(p => {
            const b = document.createElement("button"); b.textContent = p; b.className = "btn-palabra";
            b.onclick = () => seleccionarEmparejar("aleman", b, p);
            document.getElementById("palabras-aleman").appendChild(b);
        });
        esp.forEach(p => {
            const b = document.createElement("button"); b.textContent = p; b.className = "btn-palabra";
            b.onclick = () => seleccionarEmparejar("espanol", b, p);
            document.getElementById("palabras-espanol").appendChild(b);
        });
    }
    function seleccionarEmparejar(tipo, btn, valor) {
        if (emparejarSeleccionados.length === 2) return;
        if (emparejarSeleccionados.find(s => s.tipo === tipo)) return;
        btn.classList.add("seleccionada");
        emparejarSeleccionados.push({ tipo, btn, valor });
        if (emparejarSeleccionados.length === 2) {
            const [s1, s2] = emparejarSeleccionados;
            const pA = s1.tipo === "aleman" ? s1.valor : s2.valor;
            const pE = s1.tipo === "espanol" ? s1.valor : s2.valor;
            const esOk = bloquePalabrasActual.some(p => p.aleman === pA && p.espanol === pE);
            if (esOk) {
                sonidoCorrcto.play(); puntos++; puntosEnEstaSesion++; registrarAciertoServidor(1);
                actualizarPuntos(); localStorage.setItem('puntosTotales', puntos.toString());
                emparejarSeleccionados.forEach(s => { s.btn.style.visibility = "hidden"; });
                bloquePalabrasActual = bloquePalabrasActual.filter(p => !(p.aleman === pA && p.espanol === pE));
                if (bloquePalabrasActual.length === 0) {
                    emparejarBloque++;
                    if (emparejarBloque * BLOQUE_TAMANIO >= emparejarPalabras.length) {
                        actividadJuego.innerHTML = "<p>¡Has terminado!</p>";
                    } else { setTimeout(cargarBloqueEmparejar, 1000); }
                }
            } else {
                sonidoIncorrecto.play(); puntos = Math.max(0, puntos - 1); actualizarPuntos();
                setTimeout(() => { emparejarSeleccionados.forEach(s => s.btn.classList.remove("seleccionada")); emparejarSeleccionados = []; }, 1000);
            }
            emparejarSeleccionados = [];
        }
    }

    // 3. ELECCIÓN MÚLTIPLE
    let eleccionPalabras = [], eleccionIndice = 0;
    function iniciarEleccionMultiple() { eleccionPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5); eleccionIndice = 0; mostrarPreguntaEleccion(); }
    function mostrarPreguntaEleccion() {
        if (eleccionIndice >= eleccionPalabras.length) { actividadJuego.innerHTML = "<p>¡Terminado!</p>"; return; }
        const p = eleccionPalabras[eleccionIndice];
        const opciones = [p.espanol, ...leccionActual.palabras.filter(x => x.espanol !== p.espanol).slice(0, 3).map(x => x.espanol)].sort(() => Math.random() - 0.5);
        actividadJuego.innerHTML = `<p><strong>${p.aleman}</strong></p><div id="opciones"></div><div id="mensaje-feedback"></div>`;
        opciones.forEach(opt => {
            const b = document.createElement("button"); b.textContent = opt; b.className = "btn-opcion";
            b.onclick = () => {
                if (opt === p.espanol) {
                    sonidoCorrcto.play(); puntos++; puntosEnEstaSesion++; registrarAciertoServidor(1);
                    eleccionIndice++; actualizarPuntos(); localStorage.setItem('puntosTotales', puntos.toString());
                    setTimeout(mostrarPreguntaEleccion, 1000);
                } else { sonidoIncorrecto.play(); }
            };
            document.getElementById("opciones").appendChild(b);
        });
    }

    // 4. ESCUCHAR
    let escucharPalabras = [], escucharIndice = 0;
    function iniciarEscuchar() { escucharPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5); escucharIndice = 0; mostrarPalabraEscuchar(); }
    function mostrarPalabraEscuchar() {
        if (escucharIndice >= escucharPalabras.length) { actividadJuego.innerHTML = "<p>¡Terminado!</p>"; return; }
        const p = escucharPalabras[escucharIndice];
        actividadJuego.innerHTML = `<button onclick="window.reproducir('${p.aleman}')">🔊 Escuchar</button><input type="text" id="input-escuchar"><button onclick="verificarEscuchar()">Verificar</button>`;
    }
    window.reproducir = (txt) => { const u = new SpeechSynthesisUtterance(txt); u.lang = 'de-DE'; window.speechSynthesis.speak(u); };
    window.verificarEscuchar = () => {
        const res = document.getElementById("input-escuchar").value.trim().toLowerCase();
        const correcta = escucharPalabras[escucharIndice].aleman.toLowerCase();
        if (res === correcta) { sonidoCorrcto.play(); puntos++; puntosEnEstaSesion++; registrarAciertoServidor(1); escucharIndice++; actualizarPuntos(); mostrarPalabraEscuchar(); }
        else { sonidoIncorrecto.play(); }
    };

    // 5. PRONUNCIACIÓN
    let palabrasPronunciacion = [], indicePalabraActual = 0;
    function iniciarPronunciar(leccion) { palabrasPronunciacion = leccion.palabras.map(p => p.aleman).sort(() => Math.random() - 0.5); indicePalabraActual = 0; mostrarPalabraPronunciacion(); }
    function mostrarPalabraPronunciacion() {
        if (indicePalabraActual >= palabrasPronunciacion.length) { actividadJuego.innerHTML = "<p>¡Terminado!</p>"; return; }
        const p = palabrasPronunciacion[indicePalabraActual];
        actividadJuego.innerHTML = `<h3>${p}</h3><button onclick="window.reproducir('${p}')">Escuchar</button><button id="btn-pronunciar">Pronunciar</button><p id="feedback-pronunciacion"></p>`;
        document.getElementById("btn-pronunciar").onclick = () => iniciarReconocimientoVoz(p);
    }
    function iniciarReconocimientoVoz(correcta) {
        const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)(); rec.lang = 'de-DE'; rec.start();
        rec.onresult = (e) => {
            const voz = e.results[0][0].transcript.toLowerCase();
            if (voz.includes(correcta.toLowerCase())) {
                sonidoCorrcto.play(); puntos++; puntosEnEstaSesion++; registrarAciertoServidor(1);
                indicePalabraActual++; actualizarPuntos(); setTimeout(mostrarPalabraPronunciacion, 1000);
            } else { sonidoIncorrecto.play(); }
        };
    }

    // BOTONES DE ACCIÓN (ORIGINALES)
    if (btnReiniciarPuntos) btnReiniciarPuntos.onclick = () => { puntos = 0; actualizarPuntos(); };
    if (btnIrActividades) btnIrActividades.onclick = () => { mostrarPantalla("pantalla-actividades"); mostrarActividades(); };
    if (btnVolverActividades) btnVolverActividades.onclick = () => mostrarPantalla("pantalla-actividades");
    if (btnVolverLecciones) btnVolverLecciones.onclick = () => { mostrarPantalla("pantalla-lecciones"); mostrarLecciones(); };
    if (btnVolverLista) btnVolverLista.onclick = () => mostrarPantalla("pantalla-lecciones");
    if (btnVerHistorial) btnVerHistorial.onclick = () => mostrarPantalla("pantalla-historial");
    if (btnGuardarPuntos) btnGuardarPuntos.onclick = guardarPuntuacionEnHistorial;
    if (btnSalirHistorial) btnSalirHistorial.onclick = () => mostrarPantalla("pantalla-lecciones");

    // Inicio Final
    mostrarPantalla("pantalla-lecciones");
    mostrarLecciones();
    actualizarPuntos();
});
