document.addEventListener("DOMContentLoaded", () => {
    const btnAcceder = document.getElementById('btn-acceder');
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const statusMessage = document.getElementById('status-message');
    const dominioPermitido = "@europaschool.org";

    if (btnAcceder) {
        btnAcceder.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = inputEmail.value.trim();
            const password = inputPassword.value;

            if (!email.endsWith(dominioPermitido)) {
                if (statusMessage) {
                    statusMessage.textContent = `Correo incorrecto: debe terminar en ${dominioPermitido}`;
                    statusMessage.style.color = 'red';
                }
                return;
            }

            try {
                const response = await fetch('https://ls-api-b1.vercel.app/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password: password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error en el inicio de sesión');
                }

                // GUARDAR DATOS EN LOCALSTORAGE
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userData', JSON.stringify(data.user));

                // REDIRECCIONES SEGÚN EL ROL
                if (data.user.role === 'student') {
                    // Sale de /pages para ir a la raíz donde está el index
                    window.location.href = '../index.html'; 
                } else if (data.user.role === 'teacher') {
                    // Se queda en /pages porque teacher.html está ahí mismo
                    window.location.href = 'teacher.html';
                }

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