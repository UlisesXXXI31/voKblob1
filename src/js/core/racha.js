 // --- FUNCIONES DE LÓGICA DE RACHA (STREAK) ---
function obtenerFechaHoy() {
    return new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Función auxiliar para calcular días (necesaria para el decaimiento)
function calcularDiasEntreFechas(fechaA, fechaB) {
    // Convierte fechas YYYY-MM-DD a objetos Date
    const d1 = new Date(fechaA);
    const d2 = new Date(fechaB);

    // Ajusta las horas para evitar problemas de DST/diferencia horaria
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    // Calcula días completos
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

function actualizarRachaDisplay() {
    const rachaNumeroEl = document.getElementById('racha-numero');
    const rachaImagenEl = document.getElementById('racha-imagen');
    
    if (rachaNumeroEl) rachaNumeroEl.textContent = rachaActual.toString();
    if (rachaImagenEl) {
        rachaImagenEl.style.visibility = (rachaActual > 0) ? 'visible' : 'hidden';
    }
}

function actualizarRacha() {
    const hoy = obtenerFechaHoy();
    
    if (!ultimaFechaActividad) {
        // 1. Caso inicial: Primera actividad.
        rachaActual = 1;
        console.log("Racha iniciada en 1.");
    } else if (ultimaFechaActividad === hoy) {
        // 2. Caso Mantenido: Ya jugó hoy.
        console.log("Racha ya mantenida hoy. Puntos añadidos.");
        rachaActual = Math.max(1, rachaActual); 
    } else {
        // 3. Caso Decaimiento o Continuidad.
        const diasDiferencia = calcularDiasEntreFechas(ultimaFechaActividad, hoy);

        if (diasDiferencia === 1) { 
            // 3a. Continuidad: Se jugó ayer.
            rachaActual++;
            console.log(`Racha continuada: ${rachaActual}`);
        } else {
            // 3b. Decaimiento: Se saltó N días.
            const diasSaltados = diasDiferencia - 1;
            
            // Aplicar el decaimiento: rachaActual = MAX(0, rachaAnterior - diasSaltados)
            rachaActual = Math.max(0, rachaActual - diasSaltados);
            
            if (rachaActual === 0) {
                console.log("Racha rota por decaimiento. Reiniciada a 0.");
            } else {
                console.log(`Racha decayó por ${diasSaltados} días. Racha actual: ${rachaActual}`);
            }
        }
    }
    
    // Guardar la fecha de hoy y el valor de la racha
    ultimaFechaActividad = hoy; 
    localStorage.setItem('rachaActual', rachaActual.toString());
    localStorage.setItem('ultimaFechaActividad', ultimaFechaActividad);
    
    actualizarRachaDisplay(); 
}