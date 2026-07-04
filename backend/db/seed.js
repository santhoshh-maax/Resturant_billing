const bcrypt = require('bcryptjs');
const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'RestaurantBillingDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function seed() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server');

        const password = process.env.SEED_USER_PASSWORD;
        if (!password) throw new Error('SEED_USER_PASSWORD is not set in .env');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Generated hash for ' + password + ':', hashedPassword);

        await pool.request().query("DELETE FROM OrderItems");
        await pool.request().query("DELETE FROM Orders");
        await pool.request().query("DELETE FROM Users");
        await pool.request().query("DELETE FROM MenuItems");

        await pool.request()
            .input('username', sql.VarChar(100), 'admin')
            .input('password', sql.VarChar(255), hashedPassword)
            .input('role', sql.VarChar(50), 'admin')
            .query("INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)");

        await pool.request()
            .input('username', sql.VarChar(100), 'customer1')
            .input('password', sql.VarChar(255), hashedPassword)
            .input('role', sql.VarChar(50), 'customer')
            .query("INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)");

        await pool.request()
            .input('username', sql.VarChar(100), 'customer2')
            .input('password', sql.VarChar(255), hashedPassword)
            .input('role', sql.VarChar(50), 'customer')
            .query("INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)");

        const items = [
            ['Chicken Tikka', 'Starters', 'Marinated chicken pieces grilled to perfection with Indian spices', 299.00, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'],
            ['Paneer Tikka', 'Starters', 'Cottage cheese marinated in spices and grilled', 249.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400'],
            ['Spring Rolls', 'Starters', 'Crispy vegetable spring rolls served with sweet chili sauce', 199.00, 'https://images.unsplash.com/photo-1761315414057-21d6bd6ca801?w=400'],
            ['Chicken Soup', 'Starters', 'Hot and sour chicken soup with vegetables', 179.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'],
            ['Butter Chicken', 'Main Course', 'Creamy tomato-based curry with tender chicken pieces', 399.00, 'https://images.unsplash.com/photo-1742599361574-6fb156181466?w=400'],
            ['Biryani', 'Main Course', 'Fragrant basmati rice layered with spiced chicken and herbs', 349.00, 'https://images.unsplash.com/photo-1566749249285-1798d7a0e470?w=400'],
            ['Dal Makhani', 'Main Course', 'Slow-cooked black lentils in rich creamy gravy', 279.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'],
            ['Naan', 'Main Course', 'Traditional oven-baked Indian flatbread', 49.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'],
            ['Mango Lassi', 'Drinks', 'Refreshing yogurt drink blended with sweet mango', 149.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'],
            ['Masala Chai', 'Drinks', 'Traditional Indian spiced tea with ginger and cardamom', 99.00, 'https://images.unsplash.com/photo-1609670438772-9cf3afc5052b?w=400'],
            ['Fresh Lime Soda', 'Drinks', 'Sparkling lime soda with a hint of mint', 89.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'],
            ['Cold Coffee', 'Drinks', 'Chilled blended coffee with cream and ice cream', 179.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'],
            ['Gulab Jamun', 'Desserts', 'Deep-fried milk dumplings soaked in rose syrup', 149.00, 'https://images.unsplash.com/photo-1593701461250-d7b22dfd3a77?w=400'],
            ['Ice Cream', 'Desserts', 'Assorted flavored ice cream with chocolate sauce', 129.00, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400'],
            ['Cheesecake', 'Desserts', 'Baked New York style cheesecake with berry compote', 249.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'],
            ['Brownie', 'Desserts', 'Warm chocolate brownie with vanilla ice cream', 199.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400']
        ];

        for (const [name, category, description, price, image_url] of items) {
            await pool.request()
                .input('name', sql.VarChar(150), name)
                .input('category', sql.VarChar(100), category)
                .input('description', sql.Text, description)
                .input('price', sql.Decimal(10,2), price)
                .input('image_url', sql.VarChar(500), image_url)
                .query(`INSERT INTO MenuItems (name, category, description, price, image_url) VALUES (@name, @category, @description, @price, @image_url)`);
        }

        console.log('Database seeded successfully!');
        console.log('---');
        console.log('Admin login:    admin / ' + password);
        console.log('Customer login: customer1 / ' + password);

        await pool.close();
    } catch (err) {
        console.error('Seed failed:', err);
    }
}

seed();
