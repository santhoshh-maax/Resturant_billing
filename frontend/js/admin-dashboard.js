document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = '../index.html';
        return;
    }

    await loadDashboard();

    function updateDateTime() {
        const now = new Date();
        document.getElementById('currentDateTime').textContent = now.toLocaleString();
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

async function loadDashboard() {
    try {
        document.getElementById('dashboardLoader').style.display = 'block';

        const data = await apiRequest('/admin/dashboard');

        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue);
        document.getElementById('totalMenuItems').textContent = data.totalMenuItems;
        document.getElementById('todaySales').textContent = formatCurrency(data.todaySales);

        document.getElementById('statsCards').style.display = 'flex';

        const tbody = document.getElementById('recentOrdersTable');
        if (data.recentOrders && data.recentOrders.length > 0) {
            tbody.innerHTML = data.recentOrders.map(order => `
                <tr>
                    <td><strong>#${order.order_id}</strong></td>
                    <td>${order.customer_name}</td>
                    <td class="fw-bold">${formatCurrency(order.total_amount)}</td>
                    <td><span class="badge bg-gold text-dark">${order.payment_method}</span></td>
                    <td>${new Date(order.order_date).toLocaleString()}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No orders yet</td></tr>';
        }

        document.getElementById('recentOrdersCard').style.display = 'block';
    } catch (err) {
        showToast('Failed to load dashboard: ' + err.message, 'error');
    } finally {
        document.getElementById('dashboardLoader').style.display = 'none';
    }
}
