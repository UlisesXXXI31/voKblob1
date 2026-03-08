// app.js
const API_BASE_URL = 'https://ls-api-b1.vercel.app';
document.addEventListener("DOMContentLoaded", () => {
    // ---- LÓGICA DE AUTENTICACIÓN ----
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token || userRole !== 'student') {
        window.location.href = 'login.html';
        return; // Detener la ejecución del script
    }

    // A partir de aquí, el usuario está autenticado como alumno
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.classList.add('pantalla-activa');
    }
    
    // ---- VARIABLES GLOBALES Y ELEMENTOS DEL DOM ----
    let puntos = parseInt(localStorage.getItem('puntosTotales')) || 0;
    let puntosUltimaSesion = parseInt(localStorage.getItem('puntosUltimaSesionGuardados')) || 0;
    let leccionActual = null;
    let actividadActual = null;

      // <<< INICIO CÓDIGO RACHA >>>
    let rachaActual = parseInt(localStorage.getItem('rachaActual')) || 0;
    let ultimaFechaActividad = localStorage.getItem('ultimaFechaActividad') || null;
    // <<< FIN CÓDIGO RACHA >>>

    // Elementos del DOM
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

     // <<< INICIO CÓDIGO RACHA - Elemento DOM >>>
    const rachaElemento = document.getElementById('racha-display'); 
    // <<< FIN CÓDIGO RACHA - Elemento DOM >>>
  

    // Sonidos
    const sonidoCorrcto = new Audio("audios/correcto.mp3");
    const sonidoIncorrecto = new Audio("audios/incorrecto.mp3");

     // Registro del Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
navigator.serviceWorker.register('/vokblob1/service-worker.js', {
    scope: '/vokblob1/' // <-- ¡AÑADE/CORRIGE ESTA LÍNEA!
})
// ... el resto de tu .then y .catch'
            
            .then(function(registration) {
                console.log('✅ SW registrado correctamente con scope:', registration.scope);
                
                // Opcional: Verificar updates
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    console.log('🔄 Nueva versión de SW encontrada');
                    
                    newWorker.addEventListener('statechange', function() {
                        console.log('📊 Estado del nuevo SW:', newWorker.state);
                    });
                });
            })
            .catch(function(error) {
                console.log('❌ Error registrando SW:', error);
                
                // Debug adicional
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    console.log('📋 SWs actualmente registrados:', registrations.length);
                });
            });
        });
    } else {
        console.log('❌ Service Worker no soportado en este navegador');
    }
}

// Ejecutar el registro
registerServiceWorker();
    

    // ---- FUNCIONES DE NAVEGACIÓN Y LÓGICA DE LA APLICACIÓN ----
    function ocultarTodasLasPantallas() {
        const pantallas = document.querySelectorAll('.pantalla');
        pantallas.forEach(p => {
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

    // Lógica de cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userData');
            window.location.href = 'login.html'; // Redirigir a la página de login
        });
    }

    function mostrarLecciones() {
        if (!leccionesContainer) return;
        leccionesContainer.innerHTML = "";
        datosLecciones.lecciones.forEach(leccion => {
            const btn = document.createElement("button");
            btn.textContent = leccion.nombre;
            btn.className = "leccion-btn";
            btn.addEventListener("click", () => {
                seleccionarLeccion(leccion);
            });
            leccionesContainer.appendChild(btn);
        });
    }

    function seleccionarLeccion(leccion) {
        leccionActual = leccion;
        mostrarListaPalabras(leccion);
    }

    function mostrarListaPalabras(leccion) {
        mostrarPantalla("pantalla-lista-palabras");
        if (!pantallaListaPalabras || !listaPalabrasContainer || !tituloListaLeccion) return;
        leccionActual = leccion;
        tituloListaLeccion.textContent = `Palabras de la lección: ${leccion.nombre}`;
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

    // Función para obtener solo las palabras que el alumno quiere estudiar ahora
    function obtenerPalabrasSeleccionadas() {
    const selector = document.getElementById("selector-bloque-examen");
    const opcion = selector.value;

    if (opcion === "todos") {
        return [...leccionActual.palabras];
    }

    const bloque = parseInt(opcion);
    const inicio = (bloque - 1) * 20;
    const fin = inicio + 20;

    const palabrasFiltradas = leccionActual.palabras.slice(inicio, fin);
    
    if (palabrasFiltradas.length === 0) {
        alert("Este bloque no tiene palabras. Mostrando todas.");
        return [...leccionActual.palabras];
    }
    
    return palabrasFiltradas;
}

    function mostrarActividades() {
        if (!actividadesContainer) return;
        actividadesContainer.innerHTML = "";
        const actividades = [
            { id: "flashcards", nombre: "Flash Cards" },
            { id: "traducir", nombre: "Traducir" },
            { id: "emparejar", nombre: "Emparejar" },
            { id: "eleccion-multiple", nombre: "Elección múltiple" },
            { id: "escuchar", nombre: "Escuchar" },
            { id: "pronunciacion", nombre: "Pronunciación" },
            { id: "contexto", nombre: "Test de Contexto (Bloques 20)" } 
        ];
        actividades.forEach(act => {
            const btn = document.createElement("button");
            btn.textContent = act.nombre;
            btn.className = "actividad-btn";
            btn.addEventListener("click", () => {
                iniciarActividad(act.id);
            });
            actividadesContainer.appendChild(btn);
        });
    }

    function actualizarPuntos() {
        if (puntosTexto) puntosTexto.textContent = `Puntos totales: ${puntos}`;
    }
   async function cargarDatosRanking() {
    const tablaBody = document.getElementById('lista-ranking');
    if (!tablaBody) return;

    try {
        // Añadimos un parámetro de tiempo para evitar que el navegador use datos viejos (caché)
        const response = await fetch('https://ls-api-b1.vercel.app/leaderboard?t=' + Date.now());
        const data = await response.json();

        console.log("Revisando datos del ranking:", data.leaderboard);

        tablaBody.innerHTML = ''; 

        if (data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((alumno, index) => {
                
                // --- BUSCADOR ULTRA-RESISTENTE DE PUNTOS ---
                let puntosXp = 0;
                
                if (alumno.stats && typeof alumno.stats.points !== 'undefined') {
                    puntosXp = alumno.stats.points;
                } else if (typeof alumno.points !== 'undefined') {
                    puntosXp = alumno.points;
                } else if (alumno.stats && typeof alumno.stats.points === 'string') {
                    puntosXp = parseInt(alumno.stats.points);
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:10px; text-align:center;">${index + 1}</td>
                    <td style="padding:10px;">${alumno.name}</td>
                    <td style="padding:10px; text-align:center; font-weight:bold; color: ${puntosXp > 0 ? '#1976d2' : '#000'}">
                        ${puntosXp} Puntos
                    </td>
                `;
                tablaBody.appendChild(tr);
            });
        } else {
            tablaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay alumnos aún</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar ranking:", error);
    }
}
        

    if (btnReiniciarPuntos) {
        btnReiniciarPuntos.addEventListener("click", () => {
            puntos = 0;
            actualizarPuntos();
        });
    }

    // Botones de navegación
    if (btnIrActividades) {
        btnIrActividades.addEventListener("click", () => {
            mostrarPantalla("pantalla-actividades");
            mostrarActividades();
            actividadJuego.innerHTML = "";
        });
    }

    if (btnVolverActividades) {
        btnVolverActividades.onclick = () => {
            mostrarPantalla("pantalla-actividades");
            actividadJuego.innerHTML = "";
        };
    }

    if (btnVolverLecciones) {
        btnVolverLecciones.addEventListener("click", () => {
            mostrarPantalla("pantalla-lecciones");
            mostrarLecciones();
            actividadJuego.innerHTML = "";
        });
    }

    if (btnVolverLista) {
        btnVolverLista.addEventListener("click", () => {
            mostrarPantalla("pantalla-lecciones");
            mostrarLecciones();
        });
    }

    if (btnVerHistorial) {
        btnVerHistorial.addEventListener("click", () => {
            mostrarHistorial();
            mostrarPantalla("pantalla-historial");
        });
    }

    if (btnGuardarPuntos) {
        btnGuardarPuntos.addEventListener("click", () => {
            guardarPuntuacionEnHistorial();
        });
    }

    if (btnSalirHistorial) {
        btnSalirHistorial.addEventListener("click", () => {
            mostrarPantalla("pantalla-lecciones");
            mostrarLecciones();
        });
    }
   // Dentro de tu DOMContentLoaded en app.js
// --- DENTRO DEL EVENTO DOMContentLoaded ---

// 1. Botón para ABRIR el ranking
// IMPORTANTE: Verifica que en tu HTML el botón tenga id="btn-ranking"
const btnRanking = document.getElementById('btn-ranking'); 
if (btnRanking) {
    btnRanking.addEventListener('click', () => {
        mostrarPantalla('pantalla-ranking'); // Usa tu función de navegación
        cargarDatosRanking();               // Llama a la función de cargar datos
    });
}

// 2. Botón para VOLVER (el que está dentro de la pantalla ranking)
const btnVolverRanking = document.getElementById('btn-volver-ranking');
if (btnVolverRanking) {
    btnVolverRanking.addEventListener('click', () => {
        mostrarPantalla('pantalla-lecciones');
         mostrarLecciones();// Cambia 'pantalla-principal' por el ID de tu menú
    });
}
     // --- FUNCIONES DE LÓGICA DE RACHA (STREAK) ---
function obtenerFechaHoy() {
    return new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Función auxiliar para calcular días (necesaria para el decaimiento)
function calcularDiasEntreFechas(fechaA, fechaB) {
    // Convierte fechas YYYY-MM-DD a objetos Date
    const d1 = new Date(fechaA);
    const d2 = new Date(fechaB);

    // Ajusta las horas para evitar problemas de DST/diferencia horaria
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    // Calcula días completos
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

function actualizarRachaDisplay() {
    // Referencias a los nuevos elementos del DOM
    const rachaNumeroEl = document.getElementById('racha-numero');
    const rachaImagenEl = document.getElementById('racha-imagen');
    
    if (rachaNumeroEl) {
        // Muestra solo el número de racha
        rachaNumeroEl.textContent = rachaActual.toString();
    }

    if (rachaImagenEl) {
        // Controla la visibilidad de la imagen
        if (rachaActual > 0) {
            // Si la racha es > 0, la imagen es visible.
            rachaImagenEl.style.visibility = 'visible';
        } else {
            // Si la racha es 0 (decaimiento total), la imagen se oculta.
            rachaImagenEl.style.visibility = 'hidden';
        }
    }
}
function actualizarRacha() {
    const hoy = obtenerFechaHoy();
    
    if (!ultimaFechaActividad) {
        // 1. Caso inicial: Primera actividad.
        rachaActual = 1;
        console.log("Racha iniciada en 1.");
    } else if (ultimaFechaActividad === hoy) {
        // 2. Caso Mantenido: Ya jugó hoy.
        console.log("Racha ya mantenida hoy. Puntos añadidos.");
        rachaActual = Math.max(1, rachaActual); 
    } else {
        // 3. Caso Decaimiento o Continuidad.
        const diasDiferencia = calcularDiasEntreFechas(ultimaFechaActividad, hoy);

        if (diasDiferencia === 1) { 
            // 3a. Continuidad: Se jugó ayer.
            rachaActual++;
            console.log(`Racha continuada: ${rachaActual}`);
        } else {
            // 3b. Decaimiento: Se saltó N días.
            const diasSaltados = diasDiferencia - 1;
            
            // Aplicar el decaimiento: rachaActual = MAX(0, rachaAnterior - diasSaltados)
            rachaActual = Math.max(0, rachaActual - diasSaltados);
            
            if (rachaActual === 0) {
                console.log("Racha rota por decaimiento. Reiniciada a 0.");
            } else {
                console.log(`Racha decayó por ${diasSaltados} días. Racha actual: ${rachaActual}`);
            }
        }
    }
    
    // Guardar la fecha de hoy y el valor de la racha
    ultimaFechaActividad = hoy; 
    localStorage.setItem('rachaActual', rachaActual.toString());
    localStorage.setItem('ultimaFechaActividad', ultimaFechaActividad);
    
    actualizarRachaDisplay(); 
}
// ---------------------------------------------

  function guardarPuntuacionEnHistorial() {
    console.log("Dentro de guardarPuntuacionEnHistorial()...");
    
    // 1. Obtener datos del usuario y el TOKEN
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token'); // <--- ¡IMPORTANTE!

    if (!userData || !userData.id || !token) {
        console.error("Error: No hay sesión activa o falta el ID/Token.");
        // (Aquí se mantiene la lógica de guardado local por si acaso...)
        return;
    }

    const puntosSesion = puntos - puntosUltimaSesion;
    
    // Solo enviamos si realmente ha ganado puntos nuevos
    if (puntosSesion <= 0) {
        console.log("No hay puntos nuevos para guardar.");
        return;
    }

    
    // --- LÓGICA DE COMPLETADO CORREGIDA ---
    let isCompleted = false;
    if (actividadActual && leccionActual && leccionActual.palabras) {
        let totalItems = leccionActual.palabras.length;
        let currentIndex = 0;

        // Asignamos el índice según la actividad
         if (actividadActual === 'flashcards') {
            currentIndex = flashcardsIndice;
        }else if (actividadActual === 'traducir') {
            currentIndex = traducirIndice;
        } else if (actividadActual === 'eleccion-multiple') {
            currentIndex = eleccionIndice;
        } else if (actividadActual === 'escuchar') {
            currentIndex = escucharIndice;
        } else if (actividadActual === 'pronunciar') {
            currentIndex = indicePalabraActual;
        } else if (actividadActual === 'contexto') {
            currentIndex = indiceContexto;
            // Para el test de contexto, el total no es la lección, sino las 20 del bloque
            totalItems = palabrasBloque.length; 
        } else if (actividadActual === 'emparejar') {
            // Lógica especial para emparejar: usamos el tamaño del bloque (10)
            if (emparejarBloque * BLOQUE_TAMANIO >= totalItems) {
                isCompleted = true;
            }
        }

        // Para las actividades que usan índice numérico (todas menos emparejar)
        if (actividadActual !== 'emparejar') {
            if (currentIndex >= totalItems && totalItems > 0) {
                isCompleted = true;
            }
        }
    }
    const progressData = {
        user: userData.id, 
        lessonName: leccionActual.nombre, 
        taskName: actividadActual,
        score: parseInt(puntosSesion), // Forzamos que sea número
        completed: isCompleted
    };

    console.log("Enviando a la API:", progressData);

    // 2. PETICIÓN CORREGIDA CON HEADERS DE AUTORIZACIÓN
    fetch(`${API_BASE_URL}/progress`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- ¡CLAVE PARA QUE EL SERVER ACEPTE!
        },
        body: JSON.stringify(progressData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log("¡Puntos actualizados en el servidor!", data);

        if (typeof cargarDatosRanking === 'function') {
        cargarDatosRanking(); 
    }
        
        // Actualizamos las variables locales para no duplicar puntos
        puntosUltimaSesion = puntos;
        localStorage.setItem("puntosUltimaSesionGuardados", puntosUltimaSesion.toString());
        localStorage.setItem('puntosTotales', puntos.toString());
    })
    .catch(error => {
        console.error('Error al guardar puntos:', error);
    });

    // Guardado en historial local 
    const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];
    historial.push({
        fecha: new Date().toLocaleString(),
        leccion: leccionActual.nombre,
        actividad: actividadActual,
        puntos: puntosSesion,
        correo: userData.email
    });
    localStorage.setItem("historialPuntos", JSON.stringify(historial));
}
    function mostrarHistorial() {
        const historialContainer = document.getElementById("historial-container");
        if (!historialContainer) return;
        historialContainer.innerHTML = "";
        const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];
        if (historial.length === 0) {
            historialContainer.textContent = "No hay historial aún.";
            return;
        }
        const lista = document.createElement("ul");
        historial.forEach(entry => {
            const li = document.createElement("li");
            li.textContent = `${entry.fecha} — ${entry.leccion || "Sin leccion"}— ${entry.actividad || "Sin actividad"} — ${entry.puntos} puntos — ${entry.correo}`;
            lista.appendChild(li);
        });
        historialContainer.appendChild(lista);
    }

    // Iniciar actividad
    function iniciarActividad(idActividad) {
        actividadActual = idActividad;
        if (tituloActividad) {
            tituloActividad.textContent = {
                "flashcards": "Actividad: Flashcards",
                "traducir": "Actividad: Traducir",
                "emparejar": "Actividad: Emparejar",
                "eleccion-multiple": "Actividad: Elección múltiple",
                "escuchar": "Actividad: Escuchar",
                "pronunciacion": "Actividad: Pronunciación",
                "contexto": "Actividad: Contexto"
            }[idActividad] || "Actividad";
        }
        
        if (actividadJuego) actividadJuego.innerHTML = "";
        
        mostrarPantalla("pantalla-actividad");
           if (idActividad === "flashcards"){
               iniciarFlashcards();
        } else if (idActividad === "traducir") {
            iniciarTraducir();
        } else if (idActividad === "emparejar") {
            iniciarEmparejar();
        } else if (idActividad === "eleccion-multiple") {
            iniciarEleccionMultiple();
        } else if (idActividad === "escuchar") {
            iniciarEscuchar();
        } else if (idActividad === "pronunciacion") {
            iniciarPronunciar(leccionActual);
        }else if (idActividad === "contexto") {
           iniciarContexto();
    }
}
    
    let listaFlashcards = [];
let indiceFlash = 0;

function iniciarFlashcards() {
    listaFlashcards = obtenerPalabrasSeleccionadas(); // Tu función de bloques de 20

    if (!listaFlashcards || listaFlashcards.length === 0) {
        alert("Selecciona primero una lección y bloque.");
        return;
    }

    indiceFlash = 0;
    mezclarPalabras(listaFlashcards);
    
    mostrarPantalla("pantalla-flashcards"); // Asegúrate de que este ID existe en el HTML
    actualizarContenidoTarjeta();
}

function actualizarContenidoTarjeta() {
    const item = listaFlashcards[indiceFlash];
    const tarjeta = document.getElementById("tarjeta-objeto");

    if (!tarjeta) return;

    // 1. Resetear el giro siempre al cambiar de palabra
    tarjeta.classList.remove("girada");

    // 2. Cambiar los textos (Usamos los IDs que pusimos en el HTML)
    document.getElementById("flash-texto-aleman").textContent = item.aleman;
    document.getElementById("flash-texto-espanol").textContent = item.espanol;
    document.getElementById("flash-texto-frase").textContent = item.frase || "";
    document.getElementById("flash-progreso").textContent = `Tarjeta ${indiceFlash + 1} de ${listaFlashcards.length}`;
}
    // --- VARIABLES GLOBALES PARA TRADUCIR ---
// Asegúrate de que estas líneas estén arriba en tu archivo o justo antes de las funciones
let traducirPalabras = [];
let traducirIndice = 0;

function iniciarTraducir() {
    console.log("Iniciando actividad Traducir...");
    
    // 1. Cargamos solo las 20 palabras del bloque seleccionado
    traducirPalabras = obtenerPalabrasSeleccionadas(); 

    if (!traducirPalabras || traducirPalabras.length === 0) {
        alert("Por favor, selecciona una lección y un bloque de palabras.");
        return;
    }

    // 2. Resetear índice y mezclar
    traducirIndice = 0;
    mezclarPalabras(traducirPalabras);

    // 3. Dibujar en pantalla
    mostrarPalabraTraducir();
}

function mostrarPalabraTraducir() {
    const contenedor = document.getElementById("actividad-juego");
    if (!contenedor) return;

    // Si hemos llegado al final de las 20 palabras
    if (traducirIndice >= traducirPalabras.length) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 20px; border: 2px solid #4caf50; border-radius: 10px;">
                <h2 style="color: #4caf50;">¡Bloque Terminado! ✅</h2>
                <p>Has repasado las ${traducirPalabras.length} palabras con éxito.</p>
                <button onclick="mostrarPantalla('pantalla-actividades')" class="btn-volver">Volver</button>
            </div>
        `;
        // IMPORTANTE: Guardar automáticamente para que el profesor vea la nota
        guardarPuntuacionEnHistorial(); 
        return;
    }

    const palabra = traducirPalabras[traducirIndice];

    // Inyectar el HTML limpio
    contenedor.innerHTML = `
        <div class="actividad-card">
            <p style="color: #666; margin-bottom: 5px;">Palabra ${traducirIndice + 1} de ${traducirPalabras.length}</p>
            <p>Escribe la traducción de:</p>
            <h2 style="font-size: 2.5rem; color: #1976d2; margin: 10px 0;">${palabra.aleman}</h2>
            
            <input type="text" id="input-traducir" placeholder="Escribe en español..." autocomplete="off" 
                   style="width: 100%; padding: 12px; font-size: 1.1rem; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px;">
            
            <div id="mensaje-feedback" style="font-weight: bold; min-height: 25px; margin-bottom: 10px;"></div>
            
            <button id="btn-verificar-traduccion" class="actividad-btn" style="width: 100%;">Verificar</button>
        </div>
    `;

    // Vincular el evento del botón inmediatamente después de crearlo
    document.getElementById("btn-verificar-traduccion").onclick = verificarTraducir;

    // Foco automático en el cuadro de texto y permitir usar la tecla "Enter"
    const input = document.getElementById("input-traducir");
    input.focus();
    input.onkeypress = (e) => { if (e.key === 'Enter') verificarTraducir(); };
}

function verificarTraducir() {
    const input = document.getElementById("input-traducir");
    const feedback = document.getElementById("mensaje-feedback");
    const palabraActual = traducirPalabras[traducirIndice];

    if (!input || !feedback) return;

    const respuestaUser = input.value.trim().toLowerCase();
    const respuestaCorrecta = palabraActual.espanol.toLowerCase();

    // Bloqueamos el botón temporalmente para evitar doble clic
    document.getElementById("btn-verificar-traduccion").disabled = true;

    if (respuestaUser === respuestaCorrecta) {
        feedback.textContent = "¡Correcto! ✅";
        feedback.style.color = "green";
        if (typeof sonidoCorrcto !== 'undefined') sonidoCorrcto.play();
        
        puntos++;
        actualizarRacha(); 
        actualizarPuntos();
        
        traducirIndice++;
        setTimeout(mostrarPalabraTraducir, 1200);
    } else {
        feedback.textContent = `Incorrecto ❌ Era: ${palabraActual.espanol}`;
        feedback.style.color = "red";
        if (typeof sonidoIncorrecto !== 'undefined') sonidoIncorrecto.play();
        
        puntos = Math.max(0, puntos - 1);
        actualizarPuntos();

        // Dejamos que lo intente de nuevo tras un segundo
        setTimeout(() => {
            document.getElementById("btn-verificar-traduccion").disabled = false;
            input.value = "";
            input.focus();
            feedback.textContent = "";
        }, 1500);
    }
}
      // Código de la actividad "Emparejar"
    let emparejarPalabras = [];
    let emparejarPares = [];
    let emparejarSeleccionados = [];
    let emparejarBloque = 0;
    const BLOQUE_TAMANIO = 10;
    let bloquePalabrasActual = []; 
  

    function iniciarEmparejar() {
        emparejarPalabras = obtenerPalabrasSeleccionadas();
        emparejarPares = [];
        emparejarSeleccionados = [];
        emparejarBloque = 0;
        cargarBloqueEmparejar();
    }

    function cargarBloqueEmparejar() {
    emparejarSeleccionados = [];
    if (actividadJuego) actividadJuego.innerHTML = "";
    const inicio = emparejarBloque * BLOQUE_TAMANIO;
    const fin = Math.min(inicio + BLOQUE_TAMANIO, emparejarPalabras.length);
    
    // Asigna a la variable global/externa
    bloquePalabrasActual = emparejarPalabras.slice(inicio, fin); 
    
    const alemanArr = bloquePalabrasActual.map(p => p.aleman);
    const espanolArr = bloquePalabrasActual.map(p => p.espanol);
    const espanolMezclado = espanolArr.sort(() => Math.random() - 0.5);
    if (actividadJuego) {
        actividadJuego.innerHTML = `
            <p>Empareja las palabras en alemán con su traducción en español:</p>
            <div id="palabras-aleman" class="contenedor-palabras"></div>
            <div id="palabras-espanol" class="contenedor-palabras"></div>
            <div id="mensaje-feedback" style="margin-top:1rem;"></div>
        `;
    }
    const contenedorAleman = document.getElementById("palabras-aleman");
    const contenedorEspanol = document.getElementById("palabras-espanol");
    // Nota: 'feedback' también debería ser global o pasado como argumento si no lo es ya
    // const feedback = document.getElementById("mensaje-feedback"); // <-- Si no es global, mover esta línea fuera de la función o a iniciarEmparejar

    alemanArr.forEach(p => { // Itera sobre alemanArr, no bloquePalabrasActual, para crear botones
        const btnAlem = document.createElement("button");
        btnAlem.textContent = p; // Usar p directamente, que ya es la palabra
        btnAlem.className = "btn-palabra";
        btnAlem.addEventListener("click", () => seleccionarEmparejar("aleman", btnAlem, p)); // Usar p
        if (contenedorAleman) contenedorAleman.appendChild(btnAlem);
    });

    espanolMezclado.forEach(espanol => {
        const btnEsp = document.createElement("button");
        btnEsp.textContent = espanol;
        btnEsp.className = "btn-palabra";
        btnEsp.addEventListener("click", () => seleccionarEmparejar("espanol", btnEsp, espanol));
        if (contenedorEspanol) contenedorEspanol.appendChild(btnEsp);
    });

    // La función seleccionarEmparejar ya no debe estar anidada aquí.
    // Debe ser una función separada en el mismo ámbito que cargarBloqueEmparejar.
    // La voy a mover en el siguiente paso.
}

       // ... después de cargarBloqueEmparejar o al mismo nivel de ámbito global
function seleccionarEmparejar(tipo, btn, valor) {
   
    const feedback = document.getElementById("mensaje-feedback"); // Mejor obtenerlo aquí cada vez si no es global

    if (emparejarSeleccionados.length === 2) return;
    if (emparejarSeleccionados.find(s => s.tipo === tipo)) return;
    btn.classList.add("seleccionada");
    emparejarSeleccionados.push({ tipo, btn, valor });
    if (emparejarSeleccionados.length === 2) {
        let palabraAleman, palabraEspanol;
        if (emparejarSeleccionados[0].tipo === "aleman") {
            palabraAleman = emparejarSeleccionados[0].valor;
            palabraEspanol = emparejarSeleccionados[1].valor;
        } else {
            palabraAleman = emparejarSeleccionados[1].valor;
            palabraEspanol = emparejarSeleccionados[0].valor;
        }
        
        // Usa la variable global/externa
        const correcto = bloquePalabrasActual.some(p => p.aleman === palabraAleman && p.espanol === palabraEspanol);
        if (correcto) {
            puntos++;

            // <<< INTEGRACIÓN RACHA >>>
            actualizarRacha(); 
            // <<< FIN INTEGRACIÓN RACHA >>>
            
            actualizarPuntos();
            localStorage.setItem('puntosTotales', puntos.toString());
            if (feedback) {
                feedback.textContent = "¡Correcto!";
                feedback.style.color = "green";
            }
            sonidoCorrcto.play();
            emparejarSeleccionados.forEach(s => {
                s.btn.style.visibility = "hidden";
                s.btn.disabled = true;
            });
            
            // --- ¡Añade esta línea para eliminar la pareja de bloquePalabrasActual! ---
            // Filtra las palabras, eliminando la pareja que acaba de ser acertada
            bloquePalabrasActual = bloquePalabrasActual.filter(p => !(p.aleman === palabraAleman && p.espanol === palabraEspanol));
            // -------------------------------------------------------------------

            if (bloquePalabrasActual.length === 0) { // <-- Ahora sí verificará el tamaño del bloque actual
                emparejarBloque++;
                if (emparejarBloque * BLOQUE_TAMANIO >= emparejarPalabras.length) {
                    if (actividadJuego) actividadJuego.innerHTML = `<p>Has terminado la actividad Emparejar.</p>`;
                } else {
                    setTimeout(() => {
                        cargarBloqueEmparejar();
                        if (feedback) feedback.textContent = "";
                    }, 1000);
                }
            }
        } else {
            puntos = Math.max(0, puntos - 1);
            actualizarPuntos();
            if (feedback) {
                feedback.textContent = "Incorrecto. Intenta de nuevo.";
                feedback.style.color = "red";
            }
            sonidoIncorrecto.play();
            setTimeout(() => {
                emparejarSeleccionados.forEach(s => {
                    s.btn.classList.remove("seleccionada");
                });
                emparejarSeleccionados = [];
                if (feedback) feedback.textContent = "";
            }, 1000);
        }
        emparejarSeleccionados = [];
    }
}

    // Código de la actividad "Elección Múltiple"
    let eleccionPalabras = [];
    let eleccionIndice = 0;

    function iniciarEleccionMultiple() {
        eleccionPalabras = obtenerPalabrasSeleccionadas();
        eleccionPalabras.sort(() => Math.random() - 0.5);
        eleccionIndice = 0;
        mostrarPreguntaEleccion();
    }

    function mostrarPreguntaEleccion() {
        if (eleccionIndice >= eleccionPalabras.length) {
            if (actividadJuego) actividadJuego.innerHTML = `<p>Has terminado la actividad Elección múltiple.</p>`;
            return;
        }
        const palabra = eleccionPalabras[eleccionIndice];
        const opciones = [palabra.espanol];
        const otrasOpciones = leccionActual.palabras
            .filter(p => p.espanol !== palabra.espanol)
            .map(p => p.espanol)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        opciones.push(...otrasOpciones);
        opciones.sort(() => Math.random() - 0.5);
        if (actividadJuego) {
            actividadJuego.innerHTML = `
                <p><strong>Alemán:</strong> ${palabra.aleman}</p>
                <div id="opciones-multiple"></div>
                <div id="mensaje-feedback" style="margin-top:1rem;"></div>
            `;
        }
        const opcionesContainer = document.getElementById("opciones-multiple");
        const feedback = document.getElementById("mensaje-feedback");
        opciones.forEach(opcion => {
            const btn = document.createElement("button");
            btn.textContent = opcion;
            btn.className = "btn-opcion";
            btn.addEventListener("click", () => {
                if (opcion === palabra.espanol) {
                    if (feedback) {
                        feedback.textContent = "¡Correcto!";
                        feedback.style.color = "green";
                    }
                    sonidoCorrcto.play();
                    puntos++;

                    // <<< INTEGRACIÓN RACHA >>>
                    actualizarRacha(); 
                    // <<< FIN INTEGRACIÓN RACHA >>>
                    
                    actualizarPuntos();
                    localStorage.setItem('puntosTotales', puntos.toString());
                    eleccionIndice++;
                    setTimeout(mostrarPreguntaEleccion, 1000);
                } else {
                    if (feedback) {
                        feedback.textContent = `Incorrecto. La respuesta correcta es: ${palabra.espanol}`;
                        feedback.style.color = "red";
                    }
                    sonidoIncorrecto.play();
                    puntos = Math.max(0, puntos - 1);
                    actualizarPuntos();
                }
            });
            if (opcionesContainer) opcionesContainer.appendChild(btn);
        });
    }

    // Código de la actividad "Escuchar"
    let escucharPalabras = [];
    let escucharIndice = 0;

    function iniciarEscuchar() {
        escucharPalabras = obtenerPalabrasSeleccionadas();
        escucharIndice = 0;
        mezclarPalabras(escucharPalabras);
        mostrarPalabraEscuchar();
    }
    function mezclarPalabras(array){
        array.sort(() => Math.random() - 0.5);
    }

    function mostrarPalabraEscuchar() {
        if (escucharIndice >= escucharPalabras.length) {
            if (actividadJuego) actividadJuego.innerHTML = `<p>Has terminado la actividad Escuchar.</p>`;
            return;
        }
        const palabra = escucharPalabras[escucharIndice];
        if (actividadJuego) {
            actividadJuego.innerHTML = `
                <p>Escucha la palabra en alemán y escríbela correctamente:</p>
                <button id="btn-reproducir">🔊 Reproducir palabra</button>
                <input type="text" id="input-escuchar" placeholder="Escribe la palabra en alemán" autocomplete="off" />
                <div id="mensaje-feedback" style="margin-top:1rem;"></div>
                <button id="btn-verificar-escuchar">Verificar</button>
            `;
        }
        const btnReproducir = document.getElementById("btn-reproducir");
        if (btnReproducir) btnReproducir.addEventListener("click", () => reproducirPalabra(palabra.aleman));
        const btnVerificar = document.getElementById("btn-verificar-escuchar");
        if (btnVerificar) btnVerificar.addEventListener("click", verificarEscuchar);
        const inputEscuchar = document.getElementById("input-escuchar");
        if (inputEscuchar) inputEscuchar.focus();
    }

    function reproducirPalabra(texto) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'de-DE';
            speechSynthesis.speak(utterance);
        } else {
            alert("Tu navegador no soporta síntesis de voz.");
        }
    }

    function verificarEscuchar() {
        const input = document.getElementById("input-escuchar");
        const feedback = document.getElementById("mensaje-feedback");
        const palabra = escucharPalabras[escucharIndice];
        const respuesta = input.value.trim().toLowerCase();
        const correcta = palabra.aleman.toLowerCase();
        if (respuesta === correcta) {
            if (feedback) {
                feedback.textContent = "¡Correcto!";
                feedback.style.color = "green";
            }
            sonidoCorrcto.play();
            puntos++;

            // <<< INTEGRACIÓN RACHA >>>
            actualizarRacha(); 
            // <<< FIN INTEGRACIÓN RACHA >>>
            
            escucharIndice++;
            actualizarPuntos();
            localStorage.setItem('puntosTotales', puntos.toString());
            setTimeout(mostrarPalabraEscuchar, 1000);
        } else {
            if (feedback) {
                feedback.textContent = `Incorrecto. La palabra correcta es: ${palabra.aleman}`;
                feedback.style.color = "red";
            }
            sonidoIncorrecto.play();
            puntos = Math.max(0, puntos - 1);
            actualizarPuntos();
        }
    }

    // Código de la actividad "Pronunciación"
    let palabrasPronunciacion;
    let indicePalabraActual;

    function iniciarPronunciar() {
    // 1. Obtenemos las 20 palabras del bloque seleccionado
    const palabrasDelBloque = obtenerPalabrasSeleccionadas(); 

    if (!palabrasDelBloque || palabrasDelBloque.length === 0) {
        alert("No se encontraron palabras. Selecciona una lección y bloque.");
        return;
    }

    // 2. Extraemos el alemán para el motor de voz
    palabrasPronunciacion = palabrasDelBloque.map(p => p.aleman);
    
    // 3. Reiniciamos el índice y mezclamos
    indicePalabraActual = 0;
    mezclarPalabras(palabrasPronunciacion);

    // 4. LIMPIEZA: Nos aseguramos de que el contenedor esté vacío antes de empezar
    const contenedor = document.getElementById("actividad-juego");
    if (contenedor) contenedor.innerHTML = "";

    // 5. CAMBIAMOS A LA PANTALLA (esto ya lo hace tu iniciarActividad, pero por si acaso)
    mostrarPantalla("pantalla-actividad");

    // 6. ¡ESTA ES LA LÍNEA QUE FALTA! Llamamos a la función que pinta la palabra
    mostrarPalabraPronunciacion();
}
        
    

    function mezclarPalabras(array){
        array.sort(() => Math.random() - 0.5);
    }

    function mostrarPalabraPronunciacion() {
    const contenedor = document.getElementById("actividad-juego");
    if (!contenedor) return;

    // Si terminamos las 20 palabras
    if (indicePalabraActual >= palabrasPronunciacion.length) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color: #4caf50;">¡Prueba de Pronunciación Terminada! ✅</h2>
                <p>Tus puntos han sido enviados al ranking.</p>
            </div>
        `;
        guardarPuntuacionEnHistorial(); 
        return;
    }

    const palabraActual = palabrasPronunciacion[indicePalabraActual];

    // INYECTAMOS EL CONTENIDO (Lo que no sale en tu foto)
    contenedor.innerHTML = `
        <div class="pronunciacion-card" style="text-align:center;">
            <p style="color: #666;">Palabra ${indicePalabraActual + 1} de ${palabrasPronunciacion.length}</p>
            <h2 style="font-size: 3rem; margin: 20px 0; color: #1976d2;">${palabraActual}</h2>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                <button id="btn-escuchar-pronunciacion" class="actividad-btn">🔊 Escuchar</button>
                <button id="btn-pronunciar" class="actividad-btn" style="background-color: #f44336; color:white;">🎤 Hablar</button>
            </div>
            
            <p id="feedback-pronunciacion" style="font-weight: bold; height: 25px;"></p>
        </div>
    `;

    // VINCULAMOS LOS EVENTOS (Justo después de crear los botones)
    document.getElementById('btn-escuchar-pronunciacion').onclick = () => reproducirPronunciacion(palabraActual);
    document.getElementById('btn-pronunciar').onclick = () => iniciarReconocimientoVoz(palabraActual);
}
    
    function reproducirPronunciacion(palabra) {
        const utterance = new SpeechSynthesisUtterance(palabra);
        utterance.lang = 'de-DE';
        speechSynthesis.speak(utterance);
    }

    function iniciarReconocimientoVoz(palabraCorrecta) {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Tu navegador no soporta reconocimiento de voz.');
            return;
        }
        const reconocimiento = new webkitSpeechRecognition();
        reconocimiento.lang = 'de-DE';
        reconocimiento.interimResults = false;
        reconocimiento.maxAlternatives = 1;
        const feedbackEl = document.getElementById('feedback-pronunciacion');
        if (feedbackEl) {
            feedbackEl.textContent = '🎙️ Escuchando...';
            feedbackEl.style.color = 'black';
        }
        reconocimiento.start();
        reconocimiento.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const similitud = 1 - (calcularSimilitud(transcript.toLowerCase(), palabraCorrecta.toLowerCase()) / Math.max(transcript.length, palabraCorrecta.length));
            console.log(`Transcripción: "${transcript}", Similitud: ${similitud}`);
            if (similitud > 0.7) { // 70% de similitud como umbral
                if (feedbackEl) {
                    feedbackEl.textContent = '¡Correcto! Muy buena pronunciación.';
                    feedbackEl.style.color = 'green';
                }
                sonidoCorrcto.play();
                puntos++;

                // <<< INTEGRACIÓN RACHA >>>
                actualizarRacha(); 
                // <<< FIN INTEGRACIÓN RACHA >>>
                
                actualizarPuntos();
                localStorage.setItem('puntosTotales', puntos.toString());
                indicePalabraActual++;
                setTimeout(mostrarPalabraPronunciacion, 2000);
            } else {
                if (feedbackEl) {
                    feedbackEl.textContent = `Incorrecto. Pronunciaste: "${transcript}". La palabra correcta es "${palabraCorrecta}". Inténtalo de nuevo.`;
                    feedbackEl.style.color = 'red';
                }
                sonidoIncorrecto.play();
                puntos = Math.max(0, puntos - 1);
                actualizarPuntos();
            }
        };
        reconocimiento.onerror = (event) => {
            console.error('Error de reconocimiento:', event.error);
            if (event.error === 'no-speech' && feedbackEl) {
                feedbackEl.textContent = 'No se detectó ninguna voz. Inténtalo de nuevo.';
            } else if (feedbackEl) {
                feedbackEl.textContent = 'Error al reconocer tu voz.';
            }
        };
    }

    // Función de Levenshtein
    function calcularSimilitud(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
        for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        return matrix[b.length][a.length];
    }

    // Iniciar la aplicación mostrando la primera pantalla
    mostrarPantalla("pantalla-lecciones");
    mostrarLecciones();
    actualizarPuntos();
    
  // Función que filtra las plabalras por bloques
    function filtrarPalabrasParaActividad() {
    const inicio = document.getElementById("selector-bloque-examen").value;
    
    if (inicio === "todos") {
        return [...leccionActual.palabras];
    }

    const start = parseInt(inicio);
    const end = start + 20;

    // Usamos .slice para agarrar solo el rango de 20
    const palabrasFiltradas = leccionActual.palabras.slice(start, end);
    
    return palabrasFiltradas;
}


// --- LÓGICA TEST DE CONTEXTO SIN ERRORES ---
let palabrasBloque = [];
let indiceContexto = 0;
    
// 1. Función para iniciar la configuración
function iniciarContexto() {

    // 1. Obtenemos SOLO las 20 palabras seleccionadas
    palabrasBloque = filtrarPalabrasParaActividad();

    if (palabrasBloque.length === 0) {
        alert("No hay suficientes palabras en este bloque.");
        return;
    }
    // 2. Las mezclamos para que no se copien
    palabrasBloque.sort(() => Math.random() - 0.5);

    indiceContexto = 0;
    mostrarPantalla("pantalla-contexto");
    
    // Aseguramos que se vea la configuración y se oculte el juego al principio
    const configDiv = document.getElementById("config-test");
    const juegoDiv = document.getElementById("juego-contexto");
    if (configDiv) configDiv.classList.remove("pantalla-oculta");
    if (juegoDiv) juegoDiv.classList.add("pantalla-oculta");
}

// 2. Evento para el botón de empezar examen
const btnIniciarExamen = document.getElementById("btn-iniciar-examen");
if (btnIniciarExamen) {
    btnIniciarExamen.addEventListener("click", () => {
        const selector = document.getElementById("select-bloque");
        const bloqueSeleccionado = parseInt(selector.value);
        const inicio = (bloqueSeleccionado - 1) * 20;
        const fin = inicio + 20;

        // Validamos que tengamos lección seleccionada
        if (!leccionActual) {
            alert("Selecciona una lección primero.");
            return;
        }

        palabrasBloque = obtenerPalabrasSeleccionadas();
        //palabrasBloque = leccionActual.palabras.slice(inicio, fin);

        if (palabrasBloque.length === 0) {
            alert("Este bloque está vacío.");
            return;
        }

        // Mezclar y preparar interfaz
        palabrasBloque.sort(() => Math.random() - 0.5);
        document.getElementById("config-test").classList.add("pantalla-oculta");
        document.getElementById("juego-contexto").classList.remove("pantalla-oculta");
        
        mostrarPreguntaContexto();
    });
}

// 3. Función principal del juego
function mostrarPreguntaContexto() {
    const contenedorFrase = document.getElementById("frase-pregunta");
    const contenedorOpciones = document.getElementById("opciones-contexto");
    const progreso = document.getElementById("info-progreso");
    const feedback = document.getElementById("feedback-contexto");

    // Verificación de seguridad para evitar el error de "null"
    if (!contenedorFrase || !contenedorOpciones || !progreso || !feedback) {
        console.error("Error: No se encuentran los elementos del test en el HTML.");
        return;
    }

    feedback.textContent = "";

    if (indiceContexto >= palabrasBloque.length) {
        contenedorFrase.innerHTML = "<div style='text-align:center;'><h3>¡Examen Finalizado! ✅</h3><p>Enhorabuena, has terminado este bloque.</p></div>";
        contenedorOpciones.innerHTML = "";
        progreso.textContent = "";
        guardarPuntuacionEnHistorial(); // Guarda los puntos al servidor
        return;
    }

    const item = palabrasBloque[indiceContexto];
    progreso.textContent = `Pregunta ${indiceContexto + 1} de ${palabrasBloque.length}`;
    
    // Si no hay frase, mostramos un aviso amable
    contenedorFrase.textContent = item.frase || "Falta la frase de ejemplo para esta palabra...";

    // Generar opciones: Correcta + 3 distractores
    let opciones = [item.aleman];
    let otros = palabrasBloque.filter(p => p.aleman !== item.aleman);
    otros.sort(() => Math.random() - 0.5);
    opciones.push(...otros.slice(0, 3).map(p => p.aleman));
    opciones.sort(() => Math.random() - 0.5);

    contenedorOpciones.innerHTML = "";
    opciones.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.className = "actividad-btn";
        btn.onclick = () => {
            if (opt === item.aleman) {
                feedback.textContent = "Sehr gut! 🌟";
                feedback.style.color = "green";
                sonidoCorrcto.play();
                puntos += 2;
                actualizarRacha();
                actualizarPuntos();
                indiceContexto++;
                setTimeout(mostrarPreguntaContexto, 1500);
            } else {
                feedback.textContent = `Falsch! ❌ Era: ${item.aleman}`;
                feedback.style.color = "red";
                sonidoIncorrecto.play();
            }
        };
        contenedorOpciones.appendChild(btn);
    });
}

// 4. Botón Volver
const btnVolverContexto = document.getElementById("btn-volver-de-contexto");
if (btnVolverContexto) {
    btnVolverContexto.onclick = () => {
        mostrarPantalla("pantalla-actividades");
        mostrarActividades(); // Corregido el nombre (con 'r')
    };
}
    //------FLASHCARDS---------
    // Girar al tocar la tarjeta
const objTarjeta = document.getElementById("tarjeta-objeto");
if (objTarjeta) {
    objTarjeta.onclick = () => objTarjeta.classList.toggle("girada");
}

// Botón Siguiente
const btnSig = document.getElementById("btn-flash-next");
if (btnSig) {
    btnSig.onclick = () => {
        if (indiceFlash < listaFlashcards.length - 1) {
            indiceFlash++;
            actualizarContenidoTarjeta();
        } else {
            alert("¡Has terminado el repaso de este bloque!");
        }
    };
}

// Botón Anterior
const btnAnt = document.getElementById("btn-flash-prev");
if (btnAnt) {
    btnAnt.onclick = () => {
        if (indiceFlash > 0) {
            indiceFlash--;
            actualizarContenidoTarjeta();
        }
    };
}

// Botón Volver
const btnVol = document.getElementById("btn-flash-volver");
if (btnVol) {
    btnVol.onclick = () => {
        mostrarPantalla("pantalla-actividades");
    };
}
});
