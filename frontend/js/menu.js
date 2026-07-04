let menuItems = [];
let currentCategory = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    if (!isAdmin() && !window.location.pathname.includes('admin')) {
        updateCartCount();
    }

    await loadMenuItems();
});

async function loadMenuItems() {
    try {
        document.getElementById('menuLoader').style.display = 'block';

        const data = await apiRequest('/menu');
        menuItems = data;
        renderMenu();
    } catch (err) {
        showToast('Failed to load menu: ' + err.message, 'error');
    } finally {
        document.getElementById('menuLoader').style.display = 'none';
    }
}

function renderMenu() {
    const container = document.getElementById('menuContainer');
    let filtered = [...menuItems];

    if (currentCategory !== 'All') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h5>No items found</h5>
                    <p class="text-muted">Try adjusting your search or filter.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="card restaurant-card h-100 position-relative">
                <span class="category-badge">${item.category}</span>
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'}"
                     class="card-img-top" alt="${item.name}"
                     onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text text-muted small flex-grow-1">${item.description || ''}</p>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="price-tag">₹${parseFloat(item.price).toFixed(2)}</span>
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="changeQty(this, -1)">-</button>
                            <input type="number" class="form-control form-control-sm" value="1" min="1" style="width:50px" id="qty-${item.item_id}">
                            <button class="quantity-btn" onclick="changeQty(this, 1)">+</button>
                        </div>
                    </div>
                    <button class="btn btn-primary-custom w-100 mt-3" onclick="addToCart(${item.item_id})">
                        <i class="fas fa-cart-plus me-2"></i>Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function changeQty(btn, delta) {
    const input = btn.parentElement.querySelector('input');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
}

async function addToCart(itemId) {
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(qtyInput.value) || 1;

    try {
        await apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId, quantity })
        });

        showToast('Item added to cart!', 'success');
        updateCartCount();
    } catch (err) {
        showToast('Failed to add to cart: ' + err.message, 'error');
    }
}

function filterMenu() {
    searchQuery = document.getElementById('searchInput').value;
    renderMenu();
}

function filterByCategory(category, btn) {
    currentCategory = category;

    document.querySelectorAll('.category-filter .btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    renderMenu();
}
