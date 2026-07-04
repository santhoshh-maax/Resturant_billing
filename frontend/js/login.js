document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';

    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        errorDiv.classList.remove('d-none');
        return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.user.role !== role) {
            errorDiv.textContent = `This account is not registered as ${role}`;
            errorDiv.classList.remove('d-none');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast('Login successful! Welcome back.', 'success');

        setTimeout(() => {
            if (data.user.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'customer/menu.html';
            }
        }, 500);

    } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please try again.';
        errorDiv.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
    }
});
