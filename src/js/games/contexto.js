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
    const actividadJuego = document.getElementById("actividad-juego");
    
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