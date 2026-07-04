let menuItems = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = '../index.html';
        return;
    }

    await loadMenuItems();
});

async function loadMenuItems() {
    try {
        const data = await apiRequest('/menu');
        menuItems = data;
        renderMenuTable();
    } catch (err) {
        showToast('Failed to load menu: ' + err.message, 'error');
    }
}

function renderMenuTable() {
    const tbody = document.getElementById('menuItemsTable');
    const search = (document.getElementById('menuSearch')?.value || '').toLowerCase();

    let filtered = menuItems;
    if (search) {
        filtered = menuItems.filter(item =>
            item.name.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No menu items found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'}"
                     alt="${item.name}"
                     style="width:60px;height:40px;object-fit:cover;border-radius:6px"
                     onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'">
            </td>
            <td class="fw-semibold">${item.name}</td>
            <td><span class="badge bg-danger">${item.category}</span></td>
            <td class="fw-bold">${formatCurrency(item.price)}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editItem('${item.item_id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.item_id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterMenuItems() {
    renderMenuTable();
}

async function addMenuItem() {
    const name = document.getElementById('addName').value.trim();
    const category = document.getElementById('addCategory').value;
    const price = document.getElementById('addPrice').value;
    const description = document.getElementById('addDescription').value.trim();
    const image_url = document.getElementById('addImageUrl').value.trim();

    if (!name || !category || !price) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        await apiRequest('/menu', {
            method: 'POST',
            body: JSON.stringify({ name, category, description, price: parseFloat(price), image_url })
        });

        showToast('Menu item added successfully!', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        modal.hide();

        document.getElementById('addItemForm').reset();
        await loadMenuItems();
    } catch (err) {
        showToast('Failed to add item: ' + err.message, 'error');
    }
}

async function editItem(id) {
    const item = menuItems.find(i => i.item_id === id);
    if (!item) return;

    document.getElementById('editItemId').value = item.item_id;
    document.getElementById('editName').value = item.name;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editImageUrl').value = item.image_url || '';

    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
}

async function updateMenuItem() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editName').value.trim();
    const category = document.getElementById('editCategory').value;
    const price = document.getElementById('editPrice').value;
    const description = document.getElementById('editDescription').value.trim();
    const image_url = document.getElementById('editImageUrl').value.trim();

    if (!name || !category || !price) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        await apiRequest(`/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, category, description, price: parseFloat(price), image_url })
        });

        showToast('Menu item updated successfully!', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
        modal.hide();

        await loadMenuItems();
    } catch (err) {
        showToast('Failed to update item: ' + err.message, 'error');
    }
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        await apiRequest(`/menu/${id}`, { method: 'DELETE' });
        showToast('Menu item deleted', 'success');
        await loadMenuItems();
    } catch (err) {
        showToast('Failed to delete item: ' + err.message, 'error');
    }
}
