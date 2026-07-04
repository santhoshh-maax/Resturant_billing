-- RestaurantBillingDB Database Initialization Script
-- Run this in SQL Server Management Studio (SSMS)

CREATE DATABASE RestaurantBillingDB;
GO

USE RestaurantBillingDB;
GO

-- Users Table
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'admin'))
);
GO

-- MenuItems Table
CREATE TABLE MenuItems (
    item_id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Starters', 'Main Course', 'Drinks', 'Desserts')),
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    image_url VARCHAR(500)
);
GO

-- Orders Table
CREATE TABLE Orders (
    order_id INT PRIMARY KEY IDENTITY(1,1),
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'UPI')),
    order_date DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (customer_id) REFERENCES Users(user_id)
);
select * from Orders
GO

-- OrderItems Table
CREATE TABLE OrderItems (
    order_item_id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_MenuItems FOREIGN KEY (item_id) REFERENCES MenuItems(item_id)
);
GO

-- Sample Data Insertion

-- Users (password is 'password123' hashed with bcrypt)
INSERT INTO Users (username, password, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
('customer1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer'),
('customer2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer');
GO

-- Menu Items
INSERT INTO MenuItems (name, category, description, price, image_url) VALUES
('Chicken Tikka', 'Starters', 'Marinated chicken pieces grilled to perfection with Indian spices', 299.00, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'),
('Paneer Tikka', 'Starters', 'Cottage cheese marinated in spices and grilled', 249.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400'),
('Spring Rolls', 'Starters', 'Crispy vegetable spring rolls served with sweet chili sauce', 199.00, 'https://images.unsplash.com/photo-1601050690597-df0568f7095c?w=400'),
('Chicken Soup', 'Starters', 'Hot and sour chicken soup with vegetables', 179.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'),
('Butter Chicken', 'Main Course', 'Creamy tomato-based curry with tender chicken pieces', 399.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae7b9?w=400'),
('Biryani', 'Main Course', 'Fragrant basmati rice layered with spiced chicken and herbs', 349.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f4?w=400'),
('Dal Makhani', 'Main Course', 'Slow-cooked black lentils in rich creamy gravy', 279.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),
('Naan', 'Main Course', 'Traditional oven-baked Indian flatbread', 49.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'),
('Mango Lassi', 'Drinks', 'Refreshing yogurt drink blended with sweet mango', 149.00, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'),
('Masala Chai', 'Drinks', 'Traditional Indian spiced tea with ginger and cardamom', 99.00, 'https://images.unsplash.com/photo-1563822249366-3efb23b8e0c8?w=400'),
('Fresh Lime Soda', 'Drinks', 'Sparkling lime soda with a hint of mint', 89.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'),
('Cold Coffee', 'Drinks', 'Chilled blended coffee with cream and ice cream', 179.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
('Gulab Jamun', 'Desserts', 'Deep-fried milk dumplings soaked in rose syrup', 149.00, 'https://images.unsplash.com/photo-1602357283205-1b71c99cd581?w=400'),
('Ice Cream', 'Desserts', 'Assorted flavored ice cream with chocolate sauce', 129.00, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400'),
('Cheesecake', 'Desserts', 'Baked New York style cheesecake with berry compote', 249.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'),
('Brownie', 'Desserts', 'Warm chocolate brownie with vanilla ice cream', 199.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400');
GO
	