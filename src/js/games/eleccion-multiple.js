    let eleccionPalabras = [];
    let eleccionIndice = 0;

    function iniciarEleccionMultiple() {
        eleccionPalabras = obtenerPalabrasSeleccionadas();
        eleccionPalabras.sort(() => Math.random() - 0.5);
        eleccionIndice = 0;
        mostrarPreguntaEleccion();
    }

    function mostrarPreguntaEleccion() {
        const actividadJuego = document.getElementById("actividad-juego");
        
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
