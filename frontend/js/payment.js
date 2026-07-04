let cartData = null;
let selectedMethod = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    updateCartCount();
    await loadPaymentData();
});

async function loadPaymentData() {
    try {
        document.getElementById('paymentLoader').style.display = 'block';

        const data = await apiRequest('/cart');
        cartData = data;

        if (!data.items || data.items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        renderOrderSummary(data);
        document.getElementById('paymentLoader').style.display = 'none';
        document.getElementById('paymentContent').style.display = 'block';
    } catch (err) {
        showToast('Failed to load payment data: ' + err.message, 'error');
        setTimeout(() => window.location.href = 'cart.html', 1500);
    }
}

function renderOrderSummary(data) {
    const itemsDiv = document.getElementById('paymentItems');
    itemsDiv.innerHTML = data.items.map(item => `
        <div class="summary-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${parseFloat(item.subtotal).toFixed(2)}</span>
        </div>
    `).join('');

    document.getElementById('paymentSubtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('paymentGst').textContent = formatCurrency(data.gst);
    document.getElementById('paymentTotal').textContent = formatCurrency(data.total);
}

function selectPayment(method, el) {
    selectedMethod = method;

    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    document.getElementById('payButton').disabled = false;
}

async function processPayment() {
    if (!selectedMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }

    const payBtn = document.getElementById('payButton');
    payBtn.disabled = true;
    payBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        const data = await apiRequest('/billing/create', {
            method: 'POST',
            body: JSON.stringify({ payment_method: selectedMethod })
        });

        showToast('Payment successful! Order placed.', 'success');
        updateCartCount();
        showInvoice(data);
    } catch (err) {
        showToast('Payment failed: ' + err.message, 'error');
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Pay Now';
    }
}

function showInvoice(data) {
    document.getElementById('paymentContent').style.display = 'none';
    document.getElementById('successContent').style.display = 'block';

    document.getElementById('invoiceNumber').textContent = data.order_id;
    document.getElementById('invoiceDate').textContent = new Date().toLocaleString();
    document.getElementById('invoiceMethod').textContent = data.payment_method;

    const tbody = document.getElementById('invoiceItems');
    tbody.innerHTML = data.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${parseFloat(item.price).toFixed(2)}</td>
            <td>₹${parseFloat(item.subtotal).toFixed(2)}</td>
        </tr>
    `).join('');

    document.getElementById('invoiceSubtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('invoiceGst').textContent = formatCurrency(data.gst);
    document.getElementById('invoiceTotal').textContent = formatCurrency(data.total_amount);
}

function printInvoice() {
    const invoice = document.getElementById('invoiceSection').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Invoice</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; }
                .invoice { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; }
                .invoice-header { text-align: center; margin-bottom: 25px; }
                .invoice-header h3 { color: #dc3545; }
                .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .invoice-table th { background: #dc3545; color: #fff; padding: 10px; text-align: left; }
                .invoice-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
                .invoice-total { text-align: right; margin-top: 15px; }
                .invoice-total h4 { color: #dc3545; }
                @media print { body { padding: 20px; } .invoice { border: none; } }
            </style>
        </head>
        <body>
            <div class="invoice">${invoice}</div>
            <p class="text-center text-muted mt-4">Thank you for dining with us!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
}
