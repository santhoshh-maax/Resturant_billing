const MenuItem = require('../models/MenuItem');

exports.getAllItems = async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 });
        res.json(items);
    } catch (err) {
        console.error('Get menu error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(item);
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

        const item = await MenuItem.create({
            name,
            category,
            description: description || '',
            price,
            image_url: image_url || ''
        });

        res.status(201).json({
            message: 'Menu item created',
            item_id: item._id
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

        const existing = await MenuItem.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        const updates = {};
        if (name !== undefined && name !== null) updates.name = name;
        if (category !== undefined && category !== null) updates.category = category;
        if (description !== undefined) updates.description = description;
        if (price !== undefined && price !== null) updates.price = price;
        if (image_url !== undefined) updates.image_url = image_url;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await MenuItem.findByIdAndUpdate(id, updates);

        res.json({ message: 'Menu item updated' });
    } catch (err) {
        console.error('Update item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await MenuItem.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await MenuItem.findByIdAndDelete(id);
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        console.error('Delete item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
