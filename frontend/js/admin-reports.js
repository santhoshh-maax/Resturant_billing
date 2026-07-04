document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = '../index.html';
        return;
    }
});

async function loadReport(type) {
    const loader = document.getElementById('reportLoader');
    const content = document.getElementById('reportContent');

    loader.classList.remove('d-none');
    content.style.display = 'none';

    try {
        const data = await apiRequest(`/admin/sales?type=${type}`);

        const title = type === 'daily' ? 'Daily Sales Report' : 'Monthly Sales Report';
        document.getElementById('reportTitle').textContent = title;
        document.getElementById('totalRevenueBadge').textContent = `Total Revenue: ${formatCurrency(data.total_revenue)}`;

        const thead = document.getElementById('reportTableHead');
        const tbody = document.getElementById('reportTableBody');

        if (type === 'daily') {
            thead.innerHTML = `<tr><th>Date</th><th>Orders</th><th>Sales</th></tr>`;
            tbody.innerHTML = data.report.map(row => `
                <tr>
                    <td><strong>${new Date(row.date).toLocaleDateString()}</strong></td>
                    <td>${row.order_count}</td>
                    <td class="fw-bold">${formatCurrency(row.total_sales)}</td>
                </tr>
            `).join('');
        } else {
            thead.innerHTML = `<tr><th>Year</th><th>Month</th><th>Orders</th><th>Sales</th></tr>`;
            const months = ['', 'January','February','March','April','May','June','July','August','September','October','November','December'];
            tbody.innerHTML = data.report.map(row => `
                <tr>
                    <td><strong>${row.year}</strong></td>
                    <td>${months[row.month]}</td>
                    <td>${row.order_count}</td>
                    <td class="fw-bold">${formatCurrency(row.total_sales)}</td>
                </tr>
            `).join('');
        }

        if (data.report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No sales data available</td></tr>';
        }

        loader.classList.add('d-none');
        content.style.display = 'block';

    } catch (err) {
        showToast('Failed to load report: ' + err.message, 'error');
        loader.classList.add('d-none');
    }
}
