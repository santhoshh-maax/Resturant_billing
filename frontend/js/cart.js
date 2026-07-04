let cartData = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    updateCartCount();
    await loadCart();
});

async function loadCart() {
    try {
        document.getElementById('cartLoader').style.display = 'block';
        document.getElementById('emptyCart').classList.add('d-none');
        document.getElementById('cartContent').style.display = 'none';

        const data = await apiRequest('/cart');
        cartData = data;

        if (!data.items || data.items.length === 0) {
            document.getElementById('cartLoader').style.display = 'none';
            document.getElementById('emptyCart').classList.remove('d-none');
            return;
        }

        renderCart(data);
    } catch (err) {
        showToast('Failed to load cart: ' + err.message, 'error');
        document.getElementById('cartLoader').style.display = 'none';
        document.getElementById('emptyCart').classList.remove('d-none');
    }
}

function renderCart(data) {
    document.getElementById('cartLoader').style.display = 'none';
    document.getElementById('cartContent').style.display = 'block';

    const tbody = document.getElementById('cartItems');
    tbody.innerHTML = data.items.map((item, index) => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'}"
                         alt="${item.name}"
                         style="width:50px;height:50px;object-fit:cover;border-radius:8px;margin-right:12px"
                         onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">${item.category}</small>
                    </div>
                </div>
            </td>
            <td class="fw-semibold">₹${parseFloat(item.price).toFixed(2)}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <button class="quantity-btn" onclick="updateQty('${item.item_id}', ${item.quantity - 1})">-</button>
                    <span class="fw-bold">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQty('${item.item_id}', ${item.quantity + 1})">+</button>
                </div>
            </td>
            <td class="fw-bold text-danger">₹${parseFloat(item.subtotal).toFixed(2)}</td>
            <td>
                <button class="btn btn-outline-danger btn-sm" onclick="removeItem('${item.item_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('cartSubtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('cartGst').textContent = formatCurrency(data.gst);
    document.getElementById('cartTotal').textContent = formatCurrency(data.total);
    updateCartCount();
}

async function updateQty(itemId, newQty) {
    if (newQty < 1) {
        await removeItem(itemId);
        return;
    }

    try {
        await apiRequest('/cart', {
            method: 'PUT',
            body: JSON.stringify({ item_id: itemId, quantity: newQty })
        });
        await loadCart();
    } catch (err) {
        showToast('Failed to update cart: ' + err.message, 'error');
    }
}

async function removeItem(itemId) {
    try {
        await apiRequest(`/cart/${itemId}`, { method: 'DELETE' });
        showToast('Item removed from cart', 'success');
        await loadCart();
        updateCartCount();
    } catch (err) {
        showToast('Failed to remove item: ' + err.message, 'error');
    }
}

async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
        await apiRequest('/cart', { method: 'DELETE' });
        showToast('Cart cleared', 'success');
        await loadCart();
        updateCartCount();
    } catch (err) {
        showToast('Failed to clear cart: ' + err.message, 'error');
    }
}

function proceedToPayment() {
    window.location.href = 'payment.html';
}
