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