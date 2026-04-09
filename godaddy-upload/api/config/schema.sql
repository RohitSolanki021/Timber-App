-- Natural Plylam B2B Ordering System - MySQL Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS plylam_b2b CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plylam_b2b;

-- Users table (Admin, Manager, Sales Person)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role ENUM('Super Admin', 'Admin', 'Manager', 'Sales Person') NOT NULL DEFAULT 'Admin',
    phone VARCHAR(20),
    mpin VARCHAR(255),
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved',
    pricing_tier TINYINT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200),
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    gst_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    pricing_tier TINYINT DEFAULT 1 CHECK (pricing_tier BETWEEN 1 AND 6),
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 50000,
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    is_active BOOLEAN DEFAULT TRUE,
    sales_person_id INT,
    sales_person_name VARCHAR(200),
    mpin VARCHAR(255),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_person_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_approval (approval_status),
    INDEX idx_sales_person (sales_person_id)
) ENGINE=InnoDB;

-- Product Groups
CREATE TABLE IF NOT EXISTS product_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- Products V2 (with variants support)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    group_name ENUM('Plywood', 'Timber') NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) DEFAULT 0,
    price_unit VARCHAR(20) DEFAULT 'sq.mt',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group (group_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Product Thicknesses (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_thicknesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    thickness VARCHAR(20) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_thickness (product_id, thickness)
) ENGINE=InnoDB;

-- Product Sizes (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_size (product_id, size)
) ENGINE=InnoDB;

-- Product Tier Pricing
CREATE TABLE IF NOT EXISTS product_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    tier TINYINT NOT NULL CHECK (tier BETWEEN 1 AND 6),
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_product_tier (product_id, tier)
) ENGINE=InnoDB;

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    image_url LONGTEXT NOT NULL,
    filename VARCHAR(255),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Stock (by product + thickness + size)
CREATE TABLE IF NOT EXISTS stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_key VARCHAR(100) UNIQUE NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    group_name VARCHAR(50),
    thickness VARCHAR(20) NOT NULL,
    size VARCHAR(20) NOT NULL,
    quantity INT DEFAULT 0,
    reserved INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_stock_key (stock_key)
) ENGINE=InnoDB;

-- Stock Variant Pricing (per thickness/size combination)
CREATE TABLE IF NOT EXISTS stock_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    tier TINYINT NOT NULL CHECK (tier BETWEEN 1 AND 6),
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
    UNIQUE KEY uk_stock_tier (stock_id, tier)
) ENGINE=InnoDB;

-- Orders V2
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(200),
    order_type ENUM('Plywood', 'Timber', 'Mixed') NOT NULL,
    status ENUM('Pending', 'Approved', 'Estimated', 'Dispatched', 'Cancelled') DEFAULT 'Pending',
    total_quantity INT DEFAULT 0,
    sub_total DECIMAL(12,2) DEFAULT 0,
    cgst DECIMAL(10,2) DEFAULT 0,
    sgst DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(12,2) DEFAULT 0,
    pricing_tier TINYINT DEFAULT 1,
    photo_reference LONGTEXT,
    notes TEXT,
    admin_notes TEXT,
    placed_by VARCHAR(200),
    placed_by_role VARCHAR(50),
    transport_mode VARCHAR(50),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    is_editable BOOLEAN DEFAULT TRUE,
    has_plywood BOOLEAN DEFAULT FALSE,
    has_timber BOOLEAN DEFAULT FALSE,
    is_estimated BOOLEAN DEFAULT FALSE,
    price_modified_by VARCHAR(255),
    price_modified_at DATETIME,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_type (order_type),
    INDEX idx_date (created_at)
) ENGINE=InnoDB;

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_group VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    thickness VARCHAR(20) NOT NULL,
    size VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- Invoices V2
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    customer_id INT NOT NULL,
    customer_name VARCHAR(200),
    order_type ENUM('Plywood', 'Timber', 'Mixed'),
    sub_total DECIMAL(12,2) DEFAULT 0,
    cgst DECIMAL(10,2) DEFAULT 0,
    sgst DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(12,2) DEFAULT 0,
    status ENUM('Pending', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Pending',
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    paid_date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    product_group VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    thickness VARCHAR(20) NOT NULL,
    size VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice (invoice_id)
) ENGINE=InnoDB;

-- Banners
CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url LONGTEXT,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB;

-- =====================
-- SEED DATA
-- =====================

-- Insert product groups
INSERT INTO product_groups (id, name, display_order) VALUES
('plywood', 'Plywood', 1),
('timber', 'Timber', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, name, role, phone, approval_status) VALUES
('admin@naturalplylam.com', SHA2('admin123', 256), 'Admin User', 'Super Admin', '9876543210', 'Approved'),
('manager@naturalplylam.com', SHA2('manager123', 256), 'Manager User', 'Manager', '9876543211', 'Approved'),
('worker@naturalplylam.com', SHA2('worker123', 256), 'Worker Admin', 'Admin', '9876543219', 'Approved'),
('sales@naturalplylam.com', SHA2('sales123', 256), 'Rahul Sales', 'Sales Person', '9876543220', 'Approved')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Get sales person ID for customer assignment
SET @sales_id = (SELECT id FROM users WHERE email = 'sales@naturalplylam.com');

-- Insert sample customers (password: customer123)
INSERT INTO customers (email, password, name, business_name, contact_person, phone, gst_number, address, city, state, pincode, pricing_tier, outstanding_balance, credit_limit, approval_status, is_active, sales_person_id, sales_person_name) VALUES
('customer1@example.com', SHA2('customer123', 256), 'ABC Furniture Works', 'ABC Furniture Works', 'John Doe', '9876543212', '27AABCU9603R1ZM', '123 Industrial Area', 'Mumbai', 'Maharashtra', '400001', 2, 15000, 50000, 'Approved', TRUE, @sales_id, 'Rahul Sales'),
('customer2@example.com', SHA2('customer123', 256), 'XYZ Interiors', 'XYZ Interiors', 'Jane Smith', '9876543213', NULL, '456 Commercial Complex', 'Delhi', 'Delhi', '110001', 1, 0, 25000, 'Pending', TRUE, @sales_id, 'Rahul Sales'),
('customer3@example.com', SHA2('customer123', 256), 'Modern Cabinets Ltd', 'Modern Cabinets Ltd', 'Mike Johnson', '9876543214', '09AAACH7409R1ZZ', '789 Manufacturing Hub', 'Bangalore', 'Karnataka', '560001', 3, 25000, 100000, 'Approved', TRUE, @sales_id, 'Rahul Sales'),
('customer4@example.com', SHA2('customer123', 256), 'Elite Woodworks', 'Elite Woodworks', 'Sarah Williams', '9876543215', NULL, '321 Artisan Lane', 'Chennai', 'Tamil Nadu', '600001', 4, 0, 30000, 'Approved', TRUE, @sales_id, 'Rahul Sales'),
('customer5@example.com', SHA2('customer123', 256), 'Premium Plyboards', 'Premium Plyboards', 'David Brown', '9876543216', '33AABCP1234A1ZX', '567 Trade Center', 'Hyderabad', 'Telangana', '500001', 5, 8500, 75000, 'Approved', TRUE, @sales_id, 'Rahul Sales'),
('customer6@example.com', SHA2('customer123', 256), 'Classic Interiors', 'Classic Interiors', 'Emily Davis', '9876543217', NULL, '890 Design District', 'Pune', 'Maharashtra', '411001', 6, 0, 40000, 'Approved', TRUE, @sales_id, 'Rahul Sales')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample products
INSERT INTO products (id, name, group_name, description, base_price, price_unit) VALUES
('PP-BSL', 'PP BSL', 'Plywood', 'Premium Plus BSL Plywood', 595.46, 'sq.mt'),
('MDF-PP', 'MDF PP Plain', 'Plywood', 'MDF Premium Plus Plain', 417.45, 'sq.mt'),
('HDF-BOIL', 'HDF Boil Plus Plain', 'Timber', 'HDF Boil Plus Plain Board', 727.63, 'sq.mt'),
('MDF-DIR', 'MDF DIR Plain', 'Timber', 'MDF DIR Plain Board', 260.61, 'sq.mt'),
('MDF-DWR', 'MDF DWR Plain', 'Timber', 'MDF DWR Plain Board', 344.47, 'sq.mt'),
('MDF-FSP', 'MDF FSP Plain', 'Timber', 'MDF FSP Plain Board', 456.94, 'sq.mt')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert product thicknesses
INSERT INTO product_thicknesses (product_id, thickness) VALUES
('PP-BSL', '11'),
('MDF-PP', '3'), ('MDF-PP', '5.5'), ('MDF-PP', '7.5'), ('MDF-PP', '11'), ('MDF-PP', '16'), ('MDF-PP', '16.75'), ('MDF-PP', '18'), ('MDF-PP', '25'),
('HDF-BOIL', '8'), ('HDF-BOIL', '12'), ('HDF-BOIL', '16.75'), ('HDF-BOIL', '18'),
('MDF-DIR', '1.9'), ('MDF-DIR', '3.3'), ('MDF-DIR', '5.5'), ('MDF-DIR', '7'), ('MDF-DIR', '7.3'), ('MDF-DIR', '11'), ('MDF-DIR', '14.5'), ('MDF-DIR', '16.5'), ('MDF-DIR', '18'), ('MDF-DIR', '25'),
('MDF-DWR', '3.3'), ('MDF-DWR', '5.5'), ('MDF-DWR', '7.3'), ('MDF-DWR', '11'), ('MDF-DWR', '17'), ('MDF-DWR', '18'), ('MDF-DWR', '25'),
('MDF-FSP', '5.5'), ('MDF-FSP', '8'), ('MDF-FSP', '12'), ('MDF-FSP', '16.75'), ('MDF-FSP', '18')
ON DUPLICATE KEY UPDATE thickness = VALUES(thickness);

-- Insert product sizes
INSERT INTO product_sizes (product_id, size) VALUES
('PP-BSL', '2.44 x 1.22'),
('MDF-PP', '2.44 x 1.22'), ('MDF-PP', '3.05 x 1.22'),
('HDF-BOIL', '2.44 x 1.22'),
('MDF-DIR', '2.44 x 1.22'),
('MDF-DWR', '2.44 x 1.22'),
('MDF-FSP', '2.44 x 1.22')
ON DUPLICATE KEY UPDATE size = VALUES(size);

-- Insert tier pricing for all products
INSERT INTO product_pricing (product_id, tier, price) VALUES
('PP-BSL', 1, 595.46), ('PP-BSL', 2, 580.00), ('PP-BSL', 3, 565.00), ('PP-BSL', 4, 550.00), ('PP-BSL', 5, 535.00), ('PP-BSL', 6, 520.00),
('MDF-PP', 1, 417.45), ('MDF-PP', 2, 400.00), ('MDF-PP', 3, 385.00), ('MDF-PP', 4, 370.00), ('MDF-PP', 5, 355.00), ('MDF-PP', 6, 340.00),
('HDF-BOIL', 1, 727.63), ('HDF-BOIL', 2, 700.00), ('HDF-BOIL', 3, 680.00), ('HDF-BOIL', 4, 660.00), ('HDF-BOIL', 5, 640.00), ('HDF-BOIL', 6, 620.00),
('MDF-DIR', 1, 260.61), ('MDF-DIR', 2, 250.00), ('MDF-DIR', 3, 240.00), ('MDF-DIR', 4, 230.00), ('MDF-DIR', 5, 220.00), ('MDF-DIR', 6, 210.00),
('MDF-DWR', 1, 344.47), ('MDF-DWR', 2, 330.00), ('MDF-DWR', 3, 315.00), ('MDF-DWR', 4, 300.00), ('MDF-DWR', 5, 285.00), ('MDF-DWR', 6, 270.00),
('MDF-FSP', 1, 456.94), ('MDF-FSP', 2, 440.00), ('MDF-FSP', 3, 425.00), ('MDF-FSP', 4, 410.00), ('MDF-FSP', 5, 395.00), ('MDF-FSP', 6, 380.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Insert stock entries for each product variant
INSERT INTO stock (stock_key, product_id, product_name, group_name, thickness, size, quantity, reserved) VALUES
('PP-BSL_11_2.44X1.22', 'PP-BSL', 'PP BSL', 'Plywood', '11', '2.44 x 1.22', 100, 0),
('MDF-PP_3_2.44X1.22', 'MDF-PP', 'MDF PP Plain', 'Plywood', '3', '2.44 x 1.22', 100, 0),
('MDF-PP_5.5_2.44X1.22', 'MDF-PP', 'MDF PP Plain', 'Plywood', '5.5', '2.44 x 1.22', 100, 0),
('MDF-PP_11_2.44X1.22', 'MDF-PP', 'MDF PP Plain', 'Plywood', '11', '2.44 x 1.22', 100, 0),
('MDF-PP_18_2.44X1.22', 'MDF-PP', 'MDF PP Plain', 'Plywood', '18', '2.44 x 1.22', 100, 0),
('HDF-BOIL_8_2.44X1.22', 'HDF-BOIL', 'HDF Boil Plus Plain', 'Timber', '8', '2.44 x 1.22', 100, 0),
('HDF-BOIL_12_2.44X1.22', 'HDF-BOIL', 'HDF Boil Plus Plain', 'Timber', '12', '2.44 x 1.22', 100, 0),
('HDF-BOIL_18_2.44X1.22', 'HDF-BOIL', 'HDF Boil Plus Plain', 'Timber', '18', '2.44 x 1.22', 100, 0),
('MDF-DIR_5.5_2.44X1.22', 'MDF-DIR', 'MDF DIR Plain', 'Timber', '5.5', '2.44 x 1.22', 100, 0),
('MDF-DIR_11_2.44X1.22', 'MDF-DIR', 'MDF DIR Plain', 'Timber', '11', '2.44 x 1.22', 100, 0),
('MDF-DIR_18_2.44X1.22', 'MDF-DIR', 'MDF DIR Plain', 'Timber', '18', '2.44 x 1.22', 100, 0),
('MDF-DWR_5.5_2.44X1.22', 'MDF-DWR', 'MDF DWR Plain', 'Timber', '5.5', '2.44 x 1.22', 100, 0),
('MDF-DWR_11_2.44X1.22', 'MDF-DWR', 'MDF DWR Plain', 'Timber', '11', '2.44 x 1.22', 100, 0),
('MDF-DWR_18_2.44X1.22', 'MDF-DWR', 'MDF DWR Plain', 'Timber', '18', '2.44 x 1.22', 100, 0),
('MDF-FSP_8_2.44X1.22', 'MDF-FSP', 'MDF FSP Plain', 'Timber', '8', '2.44 x 1.22', 100, 0),
('MDF-FSP_12_2.44X1.22', 'MDF-FSP', 'MDF FSP Plain', 'Timber', '12', '2.44 x 1.22', 100, 0),
('MDF-FSP_18_2.44X1.22', 'MDF-FSP', 'MDF FSP Plain', 'Timber', '18', '2.44 x 1.22', 100, 0)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
