

//Funcion cargar daos del ranking
 async function cargarDatosRanking() {
    const tablaBody = document.getElementById('lista-ranking');
    if (!tablaBody) return;

    try {
        // Añadimos un parámetro de tiempo para evitar que el navegador use datos viejos (caché)
        const response = await fetch('https://ls-api-b1.vercel.app/leaderboard?t=' + Date.now());
        const data = await response.json();

        console.log("Revisando datos del ranking:", data.leaderboard);

        tablaBody.innerHTML = ''; 

        if (data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((alumno, index) => {
                
                // --- BUSCADOR ULTRA-RESISTENTE DE PUNTOS ---
                let puntosXp = 0;
                
                if (alumno.stats && typeof alumno.stats.points !== 'undefined') {
                    puntosXp = alumno.stats.points;
                } else if (typeof alumno.points !== 'undefined') {
                    puntosXp = alumno.points;
                } else if (alumno.stats && typeof alumno.stats.points === 'string') {
                    puntosXp = parseInt(alumno.stats.points);
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:10px; text-align:center;">${index + 1}</td>
                    <td style="padding:10px;">${alumno.name}</td>
                    <td style="padding:10px; text-align:center; font-weight:bold; color: ${puntosXp > 0 ? '#1976d2' : '#000'}">
                        ${puntosXp} Puntos
                    </td>
                `;
                tablaBody.appendChild(tr);
            });
        } else {
            tablaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay alumnos aún</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar ranking:", error);
    }
}

//funcion guaradar puntos en el historial
function guardarPuntuacionEnHistorial() {
    console.log("Dentro de guardarPuntuacionEnHistorial()...");
    
    // 0. Referencia al botón para poder bloquearlo
    const btnGuardar = document.getElementById("btn-guardar-puntos");

    // 1. Obtener datos del usuario y el TOKEN
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token');

    if (!userData || !userData.id || !token) {
        console.error("Error: No hay sesión activa o falta el ID/Token.");
        return;
    }

    const puntosSesion = puntos - puntosUltimaSesion;
    
    // 2. VALIDACIÓN: Solo enviamos si realmente ha ganado puntos nuevos
    if (puntosSesion <= 0) {
        console.log("No hay puntos nuevos para guardar.");
        alert("No tienes puntos nuevos para subir.");
        return;
    }

    // 3. BLOQUEO DEL BOTÓN: Evita el spam (multi-clic)
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
        btnGuardar.style.backgroundColor = "#ccc"; 
    }
    
    // --- LÓGICA DE COMPLETADO ---
    let isCompleted = false;
    if (actividadActual && leccionActual && leccionActual.palabras) {
        let totalItems = leccionActual.palabras.length;
        let currentIndex = 0;

        if (actividadActual === 'flashcards') {
            currentIndex = typeof flashcardsIndice !== 'undefined' ? flashcardsIndice : 0;
        } else if (actividadActual === 'traducir') {
            currentIndex = traducirIndice;
        } else if (actividadActual === 'eleccion-multiple') {
            currentIndex = eleccionIndice;
        } else if (actividadActual === 'escuchar') {
            currentIndex = escucharIndice;
        } else if (actividadActual === 'pronunciar') {
            currentIndex = indicePalabraActual;
        } else if (actividadActual === 'contexto') {
            currentIndex = indiceContexto;
            totalItems = typeof palabrasBloque !== 'undefined' ? palabrasBloque.length : 20; 
        } else if (actividadActual === 'emparejar') {
            if (emparejarBloque * BLOQUE_TAMANIO >= totalItems) isCompleted = true;
        }

        if (actividadActual !== 'emparejar') {
            if (currentIndex >= totalItems && totalItems > 0) isCompleted = true;
        }
    }

    const progressData = {
        user: userData.id, 
        lessonName: leccionActual ? leccionActual.nombre : "General", 
        taskName: actividadActual,
        score: parseInt(puntosSesion),
        completed: isCompleted
    };

    console.log("Enviando a la API:", progressData);

    // 4. PETICIÓN AL SERVIDOR
    fetch(`${API_BASE_URL}/progress`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(progressData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log("¡Puntos actualizados en el servidor!", data);

        if (typeof cargarDatosRanking === 'function') {
            cargarDatosRanking(); 
        }
        
        // MUY IMPORTANTE: Actualizamos las variables locales para que el próximo clic dé 0 puntos
        puntosUltimaSesion = puntos;
        localStorage.setItem("puntosUltimaSesionGuardados", puntosUltimaSesion.toString());
        localStorage.setItem('puntosTotales', puntos.toString());

        // Guardado en historial local (dentro del éxito para ser coherentes)
        const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];
        historial.push({
            fecha: new Date().toLocaleString(),
            leccion: leccionActual ? leccionActual.nombre : "General",
            actividad: actividadActual,
            puntos: puntosSesion,
            correo: userData.email
        });
        localStorage.setItem("historialPuntos", JSON.stringify(historial));
        
        alert("Puntos guardados con éxito ✅");
    })
    .catch(error => {
        console.error('Error al guardar puntos:', error);
        alert("Error al conectar con el profesor. Inténtalo de nuevo.");
    }) // <--- AQUÍ NO VA PUNTO Y COMA
    .finally(() => {
        // 5. REACTIVAR EL BOTÓN (Solo después de que el servidor responda)
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Puntos (Profesor)";
            btnGuardar.style.backgroundColor = "#4caf50";
        }
    });
}

//funcion mostrar historial
function mostrarHistorial() {
        const historialContainer = document.getElementById("historial-container");
        if (!historialContainer) return;
        historialContainer.innerHTML = "";
        const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];
        if (historial.length === 0) {
            historialContainer.textContent = "No hay historial aún.";
            return;
        }
        const lista = document.createElement("ul");
        historial.forEach(entry => {
            const li = document.createElement("li");
            li.textContent = `${entry.fecha} — ${entry.leccion || "Sin leccion"}— ${entry.actividad || "Sin actividad"} — ${entry.puntos} puntos — ${entry.correo}`;
            lista.appendChild(li);
        });
        historialContainer.appendChild(lista);
    }