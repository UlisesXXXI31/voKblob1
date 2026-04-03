let emparejarPalabras = [];
    let emparejarPares = [];
    let emparejarSeleccionados = [];
    let emparejarBloque = 0;
    const BLOQUE_TAMANIO = 10;
    let bloquePalabrasActual = []; 
  

    function iniciarEmparejar() {
    const actividadJuego = document.getElementById("actividad-juego");

       if (actividadJuego) {
        actividadJuego.innerHTML = "";
        emparejarPalabras = obtenerPalabrasSeleccionadas();
        emparejarPares = [];
        emparejarSeleccionados = [];
        emparejarBloque = 0;
        cargarBloqueEmparejar();
    }
}

    function cargarBloqueEmparejar() {
    const actividadJuego = document.getElementById("actividad-juego");

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
