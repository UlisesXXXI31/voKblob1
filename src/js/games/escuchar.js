let escucharPalabras = [];
    let escucharIndice = 0;

    function iniciarEscuchar() {
        escucharPalabras = obtenerPalabrasSeleccionadas();
        escucharIndice = 0;
        mezclarPalabras(escucharPalabras);
        mostrarPalabraEscuchar();
    }
   

    function mostrarPalabraEscuchar() {
        const actividadJuego = document.getElementById("actividad-juego");
        
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