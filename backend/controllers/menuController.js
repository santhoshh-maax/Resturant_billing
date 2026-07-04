const { query } = require('../config/db');

exports.getAllItems = async (req, res) => {
    try {
        const result = await query('SELECT * FROM MenuItems ORDER BY category, name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Get menu error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM MenuItems WHERE item_id = @param0',
            [id]
        );
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Get item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, category, description, price, image_url } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Name, category, and price are required' });
        }

        const validCategories = ['Starters', 'Main Course', 'Drinks', 'Desserts'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const result = await query(
            `INSERT INTO MenuItems (name, category, description, price, image_url)
             VALUES (@param0, @param1, @param2, @param3, @param4);
             SELECT SCOPE_IDENTITY() as item_id;`,
            [name, category, description || '', price, image_url || '']
        );

        res.status(201).json({
            message: 'Menu item created',
            item_id: result.recordset[0].item_id
        });
    } catch (err) {
        console.error('Create item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, price, image_url } = req.body;

        const existing = await query(
            'SELECT * FROM MenuItems WHERE item_id = @param0',
            [id]
        );
        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        const fields = [];
        const params = [];

        if (name !== undefined && name !== null) {
            fields.push('name = @param' + params.length);
            params.push(name);
        }
        if (category !== undefined && category !== null) {
            fields.push('category = @param' + params.length);
            params.push(category);
        }
        if (description !== undefined) {
            fields.push('description = @param' + params.length);
            params.push(description);
        }
        if (price !== undefined && price !== null) {
            fields.push('price = @param' + params.length);
            params.push(price);
        }
        if (image_url !== undefined) {
            fields.push('image_url = @param' + params.length);
            params.push(image_url);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        await query(
            `UPDATE MenuItems SET ${fields.join(', ')} WHERE item_id = @param${params.length - 1}`,
            params
        );

        res.json({ message: 'Menu item updated' });
    } catch (err) {
        console.error('Update item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query(
            'SELECT * FROM MenuItems WHERE item_id = @param0',
            [id]
        );
        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await query('DELETE FROM MenuItems WHERE item_id = @param0', [id]);
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        console.error('Delete item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
