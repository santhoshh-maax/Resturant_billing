let allOrders = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = '../index.html';
        return;
    }

    await loadOrders();
});

async function loadOrders() {
    try {
        const data = await apiRequest('/admin/orders');
        allOrders = data;
        renderOrdersTable(data);
    } catch (err) {
        showToast('Failed to load orders: ' + err.message, 'error');
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.order_id}</strong></td>
            <td>${order.customer_name}</td>
            <td class="fw-bold">${formatCurrency(order.total_amount)}</td>
            <td><span class="badge bg-gold text-dark">${order.payment_method}</span></td>
            <td>${new Date(order.order_date).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary-custom" onclick="viewOrder('${order.order_id}')">
                    <i class="fas fa-eye me-1"></i>View
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewOrder(id) {
    try {
        const data = await apiRequest(`/admin/orders/${id}`);

        const order = data.order;
        const items = data.items;

        document.getElementById('orderDetailsContent').innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Order ID:</strong> #${order.order_id}</p>
                    <p class="mb-1"><strong>Customer:</strong> ${order.customer_name}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</p>
                    <p class="mb-1"><strong>Payment:</strong> ${order.payment_method}</p>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="table-danger">
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>₹${parseFloat(item.subtotal / item.quantity || item.price).toFixed(2)}</td>
                                <td>${formatCurrency(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="text-end">
                <p class="mb-1"><strong>Subtotal:</strong> ${formatCurrency(order.total_amount / 1.18)}</p>
                <p class="mb-1"><strong>GST (18%):</strong> ${formatCurrency(order.total_amount - (order.total_amount / 1.18))}</p>
                <h4 class="text-danger fw-bold">Total: ${formatCurrency(order.total_amount)}</h4>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    } catch (err) {
        showToast('Failed to load order details: ' + err.message, 'error');
    }
}

function printBill() {
    const content = document.getElementById('orderDetailsContent').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Bill</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-header h2 { color: #dc3545; margin-bottom: 5px; }
                .invoice-header p { color: #666; margin-bottom: 2px; }
                .table { margin-bottom: 20px; }
                .table thead th { background: #dc3545; color: white; }
                .total-section { text-align: right; margin-top: 20px; }
                .total-section h4 { color: #dc3545; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h2><i class="fas fa-utensils"></i> Royal Feast</h2>
                <p>Fine Dining Restaurant</p>
                <hr>
            </div>
            ${content}
            <p class="text-center text-muted mt-4">Thank you for your visit!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}

function searchOrders() {
    const query = document.getElementById('orderSearch').value.trim();

    if (!query) {
        renderOrdersTable(allOrders);
        return;
    }

    const filtered = allOrders.filter(order =>
        order.order_id.toString().includes(query) ||
        order.customer_name.toLowerCase().includes(query.toLowerCase())
    );

    renderOrdersTable(filtered);
}
