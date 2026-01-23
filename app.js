// app.js - voKblo (Versión Ultra-Segura)
const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';
let usuarioActual = null;

// Variables de Juego (Globales)
let leccionActual = null;
let actividadActual = null;
let puntosEnEstaSesion = 0;

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 App iniciada. Verificando sesión...");

    // 1. OBTENER DATOS DEL LOCALSTORAGE
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('role');

    if (!userDataStr || userRole !== 'student') {
        console.log("⚠️ Usuario no válido, redirigiendo...");
        window.location.href = 'login.html';
        return;
    }

    // Convertir texto a objeto
    try {
        usuarioActual = JSON.parse(userDataStr);
        // Crear stats de emergencia si no existen para que no de error
        if (!usuarioActual.stats) {
            usuarioActual.stats = { racha_actual: 0, puntos_totales: 0, liga_actual: 'Bronce' };
        }
    } catch (e) {
        console.error("Error al leer datos del usuario", e);
        window.location.href = 'login.html';
        return;
    }

    // 2. FORZAR VISIBILIDAD DE LA APP
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.remove('pantalla-oculta');
        appContainer.style.display = "block"; // Refuerzo por si el CSS falla
    }

    // 3. ACTUALIZAR INTERFAZ Y MOSTRAR PANTALLA INICIAL
    actualizarInterfazStats();
    mostrarPantalla("pantalla-lecciones");

    // 4. CARGAR LECCIONES (Con comprobación de seguridad)
    if (typeof datosLecciones !== 'undefined' && datosLecciones.lecciones) {
        console.log("📚 Cargando lecciones...");
        mostrarLecciones();
    } else {
        console.error("❌ Error crítico: No se encuentra la variable 'datosLecciones' en palabras.js");
        document.getElementById("lecciones-container").innerHTML = "<p style='color:red'>Error: No se pudieron cargar las lecciones. Revisa palabras.js</p>";
    }
