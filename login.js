document.addEventListener("DOMContentLoaded", () => {
    const btnAcceder = document.getElementById('btn-acceder'); // <-- Seleccionar el botón
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const statusMessage = document.getElementById('status-message');
    const dominioPermitido = "@europaschool.org";

    if (btnAcceder) { // <-- Ahora el "if" comprueba el botón
        btnAcceder.addEventListener('click', async (e) => { // <-- Escuchar el evento 'click'
            e.preventDefault();
            const email = inputEmail.value.trim();
            const password = inputPassword.value;

            // ... el resto de tu código es exactamente igual
            if (!email.endsWith(dominioPermitido)) {
                if (statusMessage) {
                    statusMessage.textContent = `Correo incorrecto: debe terminar en ${dominioPermitido}`;
                    statusMessage.style.color = 'red';
                }
                return;
            }

           try {
    // La función fetch ENVUELVE tanto la URL como el objeto de opciones
    const response = await fetch('https://ls-api-b1.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, password: password })
    }); // <-- El paréntesis del fetch se cierra aquí, después de todas las opciones.

    const data = await response.json();

    // 1. Si hay error, lanzamos la excepción para que vaya al catch
    if (!response.ok) {
        throw new Error(data.message || 'Error en el inicio de sesión');
    }

    // 2. Si llegamos aquí, el login es EXITOSO. 
    // Guardamos el objeto 'user' completo (que incluye las stats de racha y liga)
    const user = data.user;
    
    localStorage.setItem('role', user.role);
    localStorage.setItem('userData', JSON.stringify(user));

    // 3. Redirigimos según el rol
    if (user.role === 'student') {
        window.location.href = 'index.html';
    } else if (user.role === 'teacher') {
        window.location.href = 'teacher.html';
    }
    // ...
} catch (error) {
    console.error("Error al iniciar sesión:", error);
    if (statusMessage) {
        statusMessage.textContent = error.message;
        statusMessage.style.color = 'red';
    }
}
        });
    }
});
