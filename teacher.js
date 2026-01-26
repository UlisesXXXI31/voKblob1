// teacher.js (VERSIÓN FINAL Y UNIFICADA)

document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURACIÓN PRINCIPAL ---
    const API_BASE_URL = 'https://ls-api-b1.vercel.app/api';
    // ---------------------------------

    // --- VARIABLES GLOBALES PARA DATOS Y BÚSQUEDA ---
    let alumnosGlobalData = []; // Almacena la lista completa de alumnos
    const inputBuscarAlumno = document.getElementById('input-buscar-alumno'); // Nuevo input de búsqueda
    // --------------------------------------------------

    // Verificación de sesión
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    if (!token || userRole !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    // Formularios de Usuario
    const studentForm = document.getElementById('form-add-student');
    const studentNameInput = document.getElementById('student-name-add');
    const studentEmailInput = document.getElementById('student-email-add');
    const teacherForm = document.getElementById('form-add-teacher');
    const teacherNameInput = document.getElementById('teacher-name');
    const teacherEmailInput = document.getElementById('teacher-email');
    
    // Mensajes de Estado
    const studentStatusMessage = document.getElementById('status-message-student');
    const teacherStatusMessage = document.getElementById('status-message-teacher');
    
    // Contenedores de Pantalla y Progreso
    const studentListContainer = document.getElementById('student-list');
    const alumnosContainer = document.getElementById('alumnos-container'); // Contenedor de las tarjetas
    const studentProgressSection = document.getElementById('student-progress');
    const studentNameTitle = document.getElementById('student-name-title');
    const progressHistoryContainer = document.getElementById('progress-history-container');
    const btnBackToList = document.getElementById('btn-back-to-list');
    const btnLogout = document.getElementById('btn-logout');

    // --- FUNCIONES DE NAVEGACIÓN Y RENDERIZADO ---

    // Función de cambio de pantalla (para usar con la clase 'pantalla-oculta' del CSS moderno)
    function mostrarPantalla(id) {
        // Oculta ambas secciones.
        studentListContainer.classList.add('pantalla-oculta');
        studentProgressSection.classList.add('pantalla-oculta');

        const pantalla = document.getElementById(id);
        if (pantalla) {
            pantalla.classList.remove('pantalla-oculta');
            // Mover el scroll al inicio (IMPORTANTE para la usabilidad)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Función que renderiza las tarjetas de alumnos
    function renderizarAlumnos(students) {
        alumnosContainer.innerHTML = ''; // Limpiar contenedor
        
        if (students.length === 0) {
            alumnosContainer.innerHTML = '<p>No se encontraron alumnos con ese criterio.</p>';
            return;
        }

        students.forEach(user => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            
            studentCard.innerHTML = `
                <h3>${user.name}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <button class="btn-primary">Ver Progreso</button>
            `;
            
            // Asigna el evento al hacer clic en el botón de la tarjeta
            studentCard.querySelector('button').addEventListener('click', () => {
                showStudentProgress(user._id, user.name);
            });
            alumnosContainer.appendChild(studentCard);
        });
    }

    // Función para obtener los datos de la API, ALMACENARLOS y RENDERIZAR la lista
    async function fetchAndStoreStudents() {
        try {
            alumnosContainer.innerHTML = '<p>Cargando lista de alumnos...</p>';
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar alumnos');
            }

            const data = await response.json();
            
            // 1. Filtrar y almacenar la lista global
            alumnosGlobalData = data.users.filter(user => user.role === 'student');

            // 2. Renderizar la lista completa inicialmente
            renderizarAlumnos(alumnosGlobalData);

        } catch (error) {
            alumnosContainer.innerHTML = `<p style="color:red;">Error al cargar alumnos: ${error.message}. Asegúrate de que el servidor está funcionando.</p>`;
            console.error("Error:", error);
        }
    }
    
    // Función de filtrado para el input de búsqueda
    function filtrarAlumnos() {
        const query = inputBuscarAlumno.value.toLowerCase().trim();

        if (query === "") {
            renderizarAlumnos(alumnosGlobalData);
            return;
        }

        const filteredData = alumnosGlobalData.filter(alumno => 
            (alumno.name && alumno.name.toLowerCase().includes(query)) ||
            (alumno.email && alumno.email.toLowerCase().includes(query))
        );

        renderizarAlumnos(filteredData);
    }
    
    // --- LÓGICA DE EVENTOS ---

    // Evento de búsqueda en tiempo real
    if (inputBuscarAlumno) {
        inputBuscarAlumno.addEventListener('input', filtrarAlumnos);
    }
    
    // Evento del botón para volver a la lista (Usando mostrarPantalla para la animación)
    btnBackToList.addEventListener('click', () => {
        mostrarPantalla('student-list');
    });

    // Lógica para cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        });
    }

    // Función para mostrar el progreso de un alumno
    async function showStudentProgress(userId, studentName) {
        mostrarPantalla('student-progress');
        studentNameTitle.textContent = studentName;
        progressHistoryContainer.innerHTML = '<p>Cargando historial de progreso...</p>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/progress/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // ... (Resto de la lógica de manejo de respuesta y renderizado del historial) ...
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener el historial de progreso.');
            }
            
            const data = await response.json();
            progressHistoryContainer.innerHTML = '';

            if (data.progress.length === 0) {
                progressHistoryContainer.innerHTML = '<p>No hay historial de progreso para este alumno.</p>';
                return;
            }

            const ul = document.createElement('ul');
            data.progress.forEach(entry => {
                 const li = document.createElement('li');
                 const date = new Date(entry.completedAt).toLocaleString();
                 const statusText = entry.completed ? '✅ Completada' : '🔄 Incompleta';
                 li.textContent = `Fecha: ${date}, Lección: ${entry.lessonName}, Tarea: ${entry.taskName}, Puntos: ${entry.score} | Estado: ${statusText}`;
                 ul.appendChild(li);
            });
            progressHistoryContainer.appendChild(ul);

        } catch (error) {
            progressHistoryContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
            console.error("Error:", error);
        }
    }

    // Evento para añadir un nuevo profesor (COMPLETO)
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = teacherNameInput.value; 
        const email = teacherEmailInput.value;
        const password = generateRandomPassword(); 
        const role = document.getElementById('teacher-role').value;
        
        teacherStatusMessage.textContent = "Añadiendo profesor...";
        teacherStatusMessage.style.color = "black";

        if (!email.endsWith('@europaschool.org')) {
            teacherStatusMessage.textContent = "Error: El correo debe terminar en @europaschool.org";
            teacherStatusMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role })
            });
            
            const data = await response.json();

            if (response.ok) {
                teacherStatusMessage.textContent = `¡Profesor ${name} añadido con éxito!`;
                teacherStatusMessage.style.color = "green";
                alert(`¡Importante! La contraseña temporal para ${name} es: ${password}`);
                teacherForm.reset();
                await fetchAndStoreStudents(); // Refrescar lista con la nueva función
            } else {
                teacherStatusMessage.textContent = `Error al añadir profesor: ${data.message}`;
                teacherStatusMessage.style.color = "red";
            }
        } catch (error) {
            teacherStatusMessage.textContent = "Error de red. Intenta de nuevo más tarde.";
            teacherStatusMessage.style.color = "red";
            console.error("Error:", error);
        }
    });

    // Evento para añadir un nuevo alumno (COMPLETO)
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = studentNameInput.value; 
        const email = studentEmailInput.value;
        const password = generateRandomPassword(); // Usando la función para generar contraseña para el alumno también (si es necesario)
        const role = document.getElementById('student-role-add').value;
        
        studentStatusMessage.textContent = "Añadiendo alumno...";
        studentStatusMessage.style.color = "black";

        if (!email.endsWith('@europaschool.org')) {
            studentStatusMessage.textContent = "Error: El correo debe terminar en @europaschool.org";
            studentStatusMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role })
            });
            
            const data = await response.json();

            if (response.ok) {
                alert(`¡Importante! La contraseña para ${name} es: ${password}`); // Alerta de contraseña para el alumno
                studentStatusMessage.textContent = `¡Alumno ${name} añadido con éxito!`;
                studentStatusMessage.style.color = "green";
                studentForm.reset();
                await fetchAndStoreStudents(); // Refrescar lista con la nueva función
            } else {
                studentStatusMessage.textContent = `Error al añadir alumno: ${data.message}`;
                studentStatusMessage.style.color = "red";
            }
        } catch (error) {
            studentStatusMessage.textContent = "Error de red. Intenta de nuevo más tarde.";
            studentStatusMessage.style.color = "red";
            console.error("Error:", error);
        }
    });
    
    // Función para generar una contraseña aleatoria de 8 caracteres
    function generateRandomPassword() {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let password = "";
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // --- INICIO ---
    // Carga inicial de la lista de alumnos al iniciar la página.
    fetchAndStoreStudents();
});
