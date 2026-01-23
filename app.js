// app.js
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

    const userData = JSON.parse(userDataStr);

    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }
    
    // ---- VARIABLES GLOBALES Y ELEMENTOS DEL DOM (ORIGINALES) ----
    let puntos = parseInt(localStorage.getItem('puntosTotales')) || 0;
    let puntosUltimaSesion = parseInt(localStorage.getItem('puntosUltimaSesionGuardados')) || 0;
    let puntosNuevosSesion = 0; // Acumulado para el profesor
    let leccionActual = null;
    let actividadActual = null;

    // Variables de Racha (Ahora sincronizadas con userData)
    let rachaActual = userData.stats?.racha_actual || 0;

    // Elementos del DOM (ORIGINALES)
    const pantallaLecciones = document.getElementById("pantalla-lecciones");
    const pantallaActividades = document.getElementById("pantalla-actividades");
    const pantallaActividad = document.getElementById("pantalla-actividad");
    const leccionesContainer = document.getElementById("lecciones-container");
    const actividadesContainer = document.getElementById("actividades-container");
    const actividadJuego = document.getElementById("actividad-juego");
    const tituloLeccion = document.getElementById("titulo-leccion");
    const tituloActividad = document.getElementById("titulo-actividad");
    const puntosTexto = document.getElementById("puntos");
    const btnReiniciarPuntos = document.getElementById("btn-reiniciar-puntos");
    const btnVerHistorial = document.getElementById("btn-ver-historial");
    const btnGuardarPuntos = document.getElementById("btn-guardar-puntos");
    const pantallaListaPalabras = document.getElementById("pantalla-lista-palabras");
    const listaPalabrasContainer = document.getElementById("lista-palabras-container");
    const tituloListaLeccion = document.getElementById("titulo-lista-leccion");
    const btnIrActividades = document.getElementById("btn-ir-actividades");
    const btnVolverLista = document.getElementById("btn-volver-lista");
    const pantallaHistorial = document.getElementById("pantalla-historial");
    const contenedorHistorial = document.getElementById("historial-container");
    const btnSalirHistorial = document.getElementById("btn-salir-historial");
    const btnVolverLecciones = document.getElementById("btn-volver-lecciones");
    const btnVolverActividades = document.getElementById("btn-volver-actividades");
    const btnLogout = document.getElementById('btn-logout');

    // Elementos de Racha y Liga (Nuevos IDs del HTML)
    const rachaNumeroEl = document.getElementById('racha-numero');
    const rachaImagenEl = document.getElementById('racha-imagen');
    const ligaNombreEl = document.getElementById('liga-nombre');

    // Sonidos (ORIGINALES)
    const sonidoCorrcto = new Audio("audios/correcto.mp3");
    const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

    // ---- REGISTRO SERVICE WORKER (ORIGINAL) ----
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/voKblob1/service-worker.js', { scope: '/voKblob1/' })
                .then(registration => console.log('✅ SW registrado'))
                .catch(error => console.log('❌ Error SW:', error));
            });
        }
    }
    registerServiceWorker();

    // ---- FUNCIONES DE SINCRONIZACIÓN VERCEL ----

    async function sincronizarAcierto(pts = 1) {
        puntosNuevosSesion += pts;
        try {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: userData.id || userData._id,
                    score: pts,
                    lessonName: leccionActual ? leccionActual.nombre : "General",
                    taskName: actividadActual,
                    completed: false
                })
            });
            const data = await response.json();
            if (response.ok) {
                // Actualizamos racha y liga desde el servidor
                userData.stats.racha_actual = data.racha;
                localStorage.setItem('userData', JSON.stringify(userData));
                actualizarRachaDisplay();
            }
        } catch (e) { console.error("Error sincronizando:", e); }
    }

    // ---- FUNCIONES DE NAVEGACIÓN Y LÓGICA (ORIGINALES) ----
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

    function actualizarPuntos() {
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
    }

    function actualizarRachaDisplay() {
        // Añadimos esta línea de seguridad para evitar el error de la consola
        if (!userData || !userData.stats) return; 

        const stats = userData.stats;

        if (rachaNumeroEl) rachaNumeroEl.textContent = stats.racha_actual || 0;
        if (ligaNombreEl) ligaNombreEl.textContent = stats.liga_actual || 'Bronce';
        if (rachaImagenEl) {
            // Usamos stats con seguridad
            rachaImagenEl.style.visibility = (stats.racha_actual > 0) ? 'visible' : 'hidden';
        }
    }

    // --- LECCIONES (ORIGINAL) ---
    function mostrarLecciones() {
        if (!leccionesContainer) return;
        leccionesContainer.innerHTML = "";
        datosLecciones.lecciones.forEach(leccion => {
            const btn = document.createElement("button");
            btn.textContent = leccion.nombre;
            btn.className = "leccion-btn";
            btn.addEventListener("click", () => {
                leccionActual = leccion;
                mostrarListaPalabras(leccion);
            });
            leccionesContainer.appendChild(btn);
        });
    }

    function mostrarListaPalabras(leccion) {
        mostrarPantalla("pantalla-lista-palabras");
        if (!pantallaListaPalabras || !listaPalabrasContainer || !tituloListaLeccion) return;
        tituloListaLeccion.textContent = `Palabras: ${leccion.nombre}`;
        listaPalabrasContainer.innerHTML = "";
        const tabla = document.createElement("table");
        tabla.innerHTML = "<thead><tr><th>Alemán</th><th>Español</th></tr></thead><tbody></tbody>";
        leccion.palabras.forEach(par => {
            const fila = document.createElement("tr");
            fila.innerHTML = `<td>${par.aleman}</td><td>${par.espanol}</td>`;
            tabla.querySelector("tbody").appendChild(fila);
        });
        listaPalabrasContainer.appendChild(tabla);
    }

    function mostrarActividades() {
        if (!actividadesContainer) return;
        actividadesContainer.innerHTML = "";
        const actividades = [
            { id: "traducir", nombre: "Traducir" },
            { id: "emparejar", nombre: "Emparejar" },
            { id: "eleccion-multiple", nombre: "Elección múltiple" },
            { id: "escuchar", nombre: "Escuchar" },
            { id: "pronunciacion", nombre: "Pronunciación" }
        ];
        actividades.forEach(act => {
            const btn = document.createElement("button");
            btn.textContent = act.nombre;
            btn.className = "actividad-btn";
            btn.addEventListener("click", () => iniciarActividad(act.id));
            actividadesContainer.appendChild(btn);
        });
    }

    // --- RANKING / MARCADORES (NUEVO) ---
    async function cargarRanking() {
        const liga = userData.stats?.liga_actual || 'Bronce';
        const listaUI = document.getElementById("lista-ranking");
        if (!listaUI) return;
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

    document.getElementById("btn-ver-ranking")?.addEventListener("click", () => {
        mostrarPantalla("pantalla-ranking");
        cargarRanking();
    });
    document.getElementById("btn-volver-ranking")?.addEventListener("click", () => mostrarPantalla("pantalla-lecciones"));

    // --- LÓGICA DE JUEGOS (ORIGINAL + INTEGRACIÓN) ---

    // 1. TRADUCIR
    let traducirPalabras = [], traducirIndice = 0;
    function iniciarTraducir() {
        traducirPalabras = [...leccionActual.palabras].sort(() => Math.random() - 0.5);
        traducirIndice = 0; mostrarPalabraTraducir();
    }
    function mostrarPalabraTraducir() {
        if (traducirIndice >= traducirPalabras.length) {
            actividadJuego.innerHTML = "Terminado. Dale a Guardar."; return;
        }
        const p = traducirPalabras[traducirIndice];
        actividadJuego.innerHTML = `
            <p><strong>${p.aleman}</strong></p>
            <input type="text" id="input-traducir" autocomplete="off">
            <button id="btn-verificar">Verificar</button>
            <div id="mensaje-feedback"></div>
        `;
        document.getElementById("btn-verificar").onclick = () => {
            const val = document.getElementById("input-traducir").value.trim().toLowerCase();
            if (val === p.espanol.toLowerCase()) {
                sonidoCorrcto.play(); puntos++; 
                sincronizarAcierto(1);
                traducirIndice++; actualizarPuntos();
                localStorage.setItem('puntosTotales', puntos.toString());
                setTimeout(mostrarPalabraTraducir, 1000);
            } else { sonidoIncorrecto.play(); }
        };
    }

    // 2. EMPAREJAR
    let emparejarPalabras = [], emparejarBloque = 0, bloquePalabrasActual = [], emparejarSeleccionados = [];
    function iniciarEmparejar() { emparejarPalabras = [...leccionActual.palabras]; emparejarBloque = 0; cargarBloqueEmparejar(); }
    function cargarBloqueEmparejar() {
        actividadJuego.innerHTML = '<div id="palabras-aleman"></div><div id="palabras-espanol"></div>';
        const inicio = emparejarBloque * BLOQUE_TAMANIO;
        const fin = Math.min(inicio + BLOQUE_TAMANIO, emparejarPalabras.length);
        bloquePalabrasActual = emparejarPalabras.slice(inicio, fin);
        const alem = bloquePalabrasActual.map(p => p.aleman);
        const esp = bloquePalabrasActual.map(p => p.espanol).sort(() => Math.random() - 0.5);
        alem.forEach(p => {
            const b = document.createElement("button"); b.textContent = p; b.className = "btn-palabra";
            b.onclick = () => { if(emparejarSeleccionados.length<2) { b.classList.add("seleccionada"); emparejarSeleccionados.push({t:"aleman", v:p, btn:b}); verificarEmp(); } };
            document.getElementById("palabras-aleman").appendChild(b);
        });
        esp.forEach(p => {
            const b = document.createElement("button"); b.textContent = p; b.className = "btn-palabra";
            b.onclick = () => { if(emparejarSeleccionados.length<2) { b.classList.add("seleccionada"); emparejarSeleccionados.push({t:"espanol", v:p, btn:b}); verificarEmp(); } };
            document.getElementById("palabras-espanol").appendChild(b);
        });
    }
    function verificarEmp() {
        if (emparejarSeleccionados.length === 2) {
            const [s1, s2] = emparejarSeleccionados;
            const esOk = s1.t !== s2.t && bloquePalabrasActual.some(p => (p.aleman===s1.v && p.espanol===s2.v) || (p.aleman===s2.v && p.espanol===s1.v));
            if (esOk) {
                sonidoCorrcto.play(); puntos++; sincronizarAcierto(1);
                s1.btn.style.visibility = "hidden"; s2.btn.style.visibility = "hidden";
                bloquePalabrasActual = bloquePalabrasActual.filter(p => p.aleman !== (s1.t==="aleman"?s1.v:s2.v));
                if (bloquePalabrasActual.length === 0) {
                    emparejarBloque++; 
                    if (emparejarBloque * BLOQUE_TAMANIO >= emparejarPalabras.length) actividadJuego.innerHTML = "¡Terminado!";
                    else setTimeout(cargarBloqueEmparejar, 1000);
                }
            } else { sonidoIncorrecto.play(); s1.btn.classList.remove("seleccionada"); s2.btn.classList.remove("seleccionada"); }
            emparejarSeleccionados = [];
        }
    }

    // 3. ELECCIÓN MÚLTIPLE
    let eleccionIndice = 0;
    function iniciarEleccionMultiple() { eleccionIndice = 0; mostrarEleccion(); }
    function mostrarEleccion() {
        const p = leccionActual.palabras[eleccionIndice];
        if (!p) { actividadJuego.innerHTML = "¡Terminado!"; return; }
        const opts = [p.espanol, ...leccionActual.palabras.filter(x => x.espanol!==p.espanol).slice(0,3).map(x => x.espanol)].sort(() => Math.random() - 0.5);
        actividadJuego.innerHTML = `<p><strong>${p.aleman}</strong></p><div id="opts"></div>`;
        opts.forEach(o => {
            const b = document.createElement("button"); b.textContent = o; b.className = "btn-opcion";
            b.onclick = () => {
                if (o === p.espanol) { sonidoCorrcto.play(); puntos++; sincronizarAcierto(1); eleccionIndice++; mostrarEleccion(); }
                else { sonidoIncorrecto.play(); }
            };
            document.getElementById("opts").appendChild(b);
        });
    }

    // 4. ESCUCHAR
    let escucharIndice = 0;
    function iniciarEscuchar() { escucharIndice = 0; mostrarEscuchar(); }
    function mostrarEscuchar() {
        const p = leccionActual.palabras[escucharIndice];
        if (!p) { actividadJuego.innerHTML = "¡Terminado!"; return; }
        actividadJuego.innerHTML = `<button onclick="window.reproducir('${p.aleman}')">🔊</button><input type="text" id="in-esc"><button id="btn-esc">Ok</button>`;
        document.getElementById("btn-esc").onclick = () => {
            if (document.getElementById("in-esc").value.trim().toLowerCase() === p.aleman.toLowerCase()) {
                sonidoCorrcto.play(); puntos++; sincronizarAcierto(1); escucharIndice++; mostrarEscuchar();
            } else { sonidoIncorrecto.play(); }
        };
    }
    window.reproducir = (t) => { const u = new SpeechSynthesisUtterance(t); u.lang = 'de-DE'; speechSynthesis.speak(u); };

    // 5. PRONUNCIACIÓN
    let pronIndice = 0;
    function iniciarPronunciacion() { pronIndice = 0; mostrarPron(); }
    function mostrarPron() {
        const p = leccionActual.palabras[pronIndice];
        if (!p) { actividadJuego.innerHTML = "¡Terminado!"; return; }
        actividadJuego.innerHTML = `<p>${p.aleman}</p><button id="btn-hablar">🎤</button>`;
        document.getElementById("btn-hablar").onclick = () => {
            const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            rec.lang = 'de-DE'; rec.start();
            rec.onresult = (e) => {
                if (e.results[0][0].transcript.toLowerCase().includes(p.aleman.toLowerCase())) {
                    sonidoCorrcto.play(); puntos++; sincronizarAcierto(1); pronIndice++; mostrarPron();
                } else { sonidoIncorrecto.play(); }
            };
        };
    }

    // ---- GUARDAR PARA PROFESOR (Sustituye tu guardarPuntuacionEnHistorial) ----
    async function guardarPuntuacionEnHistorial() {
        if (puntosNuevosSesion === 0) return alert("Nada nuevo que guardar.");
        btnGuardarPuntos.textContent = "...";
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
            alert("✅ Guardado");
            puntosNuevosSesion = 0;
            localStorage.setItem('puntosTotales', puntos.toString());
            localStorage.setItem('puntosUltimaSesionGuardados', puntos.toString());
        } catch (e) { alert("Error"); }
        btnGuardarPuntos.textContent = "Guardar Puntos";
    }

    function iniciarActividad(id) {
        actividadActual = id;
        tituloActividad.textContent = id.toUpperCase();
        mostrarPantalla("pantalla-actividad");
        if (id === "traducir") iniciarTraducir();
        else if (id === "emparejar") iniciarEmparejar();
        else if (id === "eleccion-multiple") iniciarEleccionMultiple();
        else if (id === "escuchar") iniciarEscuchar();
        else if (id === "pronunciacion") iniciarPronunciacion();
    }

    // BOTONES NAVEGACIÓN (ORIGINALES)
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
    actualizarRachaDisplay();
});
