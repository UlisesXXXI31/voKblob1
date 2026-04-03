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