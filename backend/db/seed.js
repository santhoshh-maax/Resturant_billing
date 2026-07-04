const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        const password = process.env.SEED_USER_PASSWORD;
        if (!password) throw new Error('SEED_USER_PASSWORD is not set in .env');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Generated hash for ' + password + ':', hashedPassword);

        await OrderItem.deleteMany({});
        await Order.deleteMany({});
        await User.deleteMany({});
        await MenuItem.deleteMany({});

        await User.create([
            { username: 'admin', password: hashedPassword, role: 'admin' },
            { username: 'customer1', password: hashedPassword, role: 'customer' },
            { username: 'customer2', password: hashedPassword, role: 'customer' }
        ]);

        const items = [
            { name: 'Chicken Tikka', category: 'Starters', description: 'Marinated chicken pieces grilled to perfection with Indian spices', price: 299.00, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400' },
            { name: 'Paneer Tikka', category: 'Starters', description: 'Cottage cheese marinated in spices and grilled', price: 249.00, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400' },
            { name: 'Spring Rolls', category: 'Starters', description: 'Crispy vegetable spring rolls served with sweet chili sauce', price: 199.00, image_url: 'https://images.unsplash.com/photo-1761315414057-21d6bd6ca801?w=400' },
            { name: 'Chicken Soup', category: 'Starters', description: 'Hot and sour chicken soup with vegetables', price: 179.00, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' },
            { name: 'Butter Chicken', category: 'Main Course', description: 'Creamy tomato-based curry with tender chicken pieces', price: 399.00, image_url: 'https://images.unsplash.com/photo-1742599361574-6fb156181466?w=400' },
            { name: 'Biryani', category: 'Main Course', description: 'Fragrant basmati rice layered with spiced chicken and herbs', price: 349.00, image_url: 'https://images.unsplash.com/photo-1566749249285-1798d7a0e470?w=400' },
            { name: 'Dal Makhani', category: 'Main Course', description: 'Slow-cooked black lentils in rich creamy gravy', price: 279.00, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
            { name: 'Naan', category: 'Main Course', description: 'Traditional oven-baked Indian flatbread', price: 49.00, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
            { name: 'Mango Lassi', category: 'Drinks', description: 'Refreshing yogurt drink blended with sweet mango', price: 149.00, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400' },
            { name: 'Masala Chai', category: 'Drinks', description: 'Traditional Indian spiced tea with ginger and cardamom', price: 99.00, image_url: 'https://images.unsplash.com/photo-1609670438772-9cf3afc5052b?w=400' },
            { name: 'Fresh Lime Soda', category: 'Drinks', description: 'Sparkling lime soda with a hint of mint', price: 89.00, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
            { name: 'Cold Coffee', category: 'Drinks', description: 'Chilled blended coffee with cream and ice cream', price: 179.00, image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
            { name: 'Gulab Jamun', category: 'Desserts', description: 'Deep-fried milk dumplings soaked in rose syrup', price: 149.00, image_url: 'https://images.unsplash.com/photo-1593701461250-d7b22dfd3a77?w=400' },
            { name: 'Ice Cream', category: 'Desserts', description: 'Assorted flavored ice cream with chocolate sauce', price: 129.00, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
            { name: 'Cheesecake', category: 'Desserts', description: 'Baked New York style cheesecake with berry compote', price: 249.00, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400' },
            { name: 'Brownie', category: 'Desserts', description: 'Warm chocolate brownie with vanilla ice cream', price: 199.00, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' }
        ];

        await MenuItem.create(items);

        console.log('Database seeded successfully!');
        console.log('---');
        console.log('Admin login:    admin / ' + password);
        console.log('Customer login: customer1 / ' + password);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Seed failed:', err);
    }
}

seed();
