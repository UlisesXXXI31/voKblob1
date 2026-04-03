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