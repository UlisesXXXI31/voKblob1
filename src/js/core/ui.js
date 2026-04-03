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

//funcion actualiza puntos
function actualizarPuntos() {
    // Buscamos el elemento directamente aquí
    const puntosTexto = document.getElementById("puntos"); 
    
    if (puntosTexto) {
        puntosTexto.textContent = `Puntos totales: ${puntos}`;
    }
}

//función mezclar palabras
 function mezclarPalabras(array){
        array.sort(() => Math.random() - 0.5);
    }

// Función que filtra las plabalras por bloques(contexto)
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