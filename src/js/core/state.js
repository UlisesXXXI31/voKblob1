//variabes globales
let puntos = parseInt(localStorage.getItem('puntosTotales')) || 0;
let puntosUltimaSesion = parseInt(localStorage.getItem('puntosUltimaSesionGuardados')) || 0;
let leccionActual = null;
let actividadActual = null;
// <<< INICIO CÓDIGO RACHA >>>
let rachaActual = parseInt(localStorage.getItem('rachaActual')) || 0;
let ultimaFechaActividad = localStorage.getItem('ultimaFechaActividad') || null;
// <<< FIN CÓDIGO RACHA >>>

// Sonidos
const sonidoCorrcto = new Audio("assets/audios/audios/correcto.mp3");
const sonidoIncorrecto = new Audio("assets/audios/audios/incorrecto.mp3");