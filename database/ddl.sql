-- =====================================================
-- ULTIMATE PRODUCTION DEMO - DATABASE SCHEMA DEFINITIONS
-- =====================================================
-- This file contains all the table definitions needed
-- for the 20 microservices in the production demo
-- =====================================================

-- =====================================================
-- AUTH SERVICE TABLES
-- =====================================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission, resource)
);

-- =====================================================
-- PAYMENT SERVICE TABLES
-- =====================================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    metadata JSONB
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'credit_card', 'bank_account', etc.
    provider VARCHAR(50) NOT NULL,
    method_data JSONB NOT NULL, -- encrypted payment method details
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) REFERENCES payment_transactions(transaction_id),
    refund_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- =====================================================
-- INVENTORY SERVICE TABLES
-- =====================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(50),
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory reservations table
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- =====================================================
-- ANALYTICS SERVICE TABLES
-- =====================================================

-- Events table for tracking user actions
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER,
    session_id VARCHAR(100),
    properties JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50)
);

-- Reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(200),
    status VARCHAR(20) DEFAULT 'completed'
);

-- Metrics table
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSONB
);

-- =====================================================
-- NOTIFICATION SERVICE TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    recipient VARCHAR(200) NOT NULL,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    subject_template VARCHAR(200),
    content_template TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Delivery logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_response JSONB,
    delivered_at TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);

-- =====================================================
-- USER SERVICE TABLES
-- =====================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    date_of_birth DATE,
    avatar_url VARCHAR(200),
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'billing', 'shipping'
    street_address VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORDER SERVICE TABLES
-- =====================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_address JSONB,
    billing_address JSONB
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB -- Product details at time of order
);

-- =====================================================
-- SHIPPING SERVICE TABLES
-- =====================================================

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100) UNIQUE,
    carrier VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipped_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipment tracking events table
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status VARCHAR(20)
);

-- =====================================================
-- PRODUCT SERVICE TABLES
-- =====================================================

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES product_categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0
);

-- =====================================================
-- SEARCH SERVICE TABLES
-- =====================================================

-- Search index table
CREATE TABLE IF NOT EXISTS search_index (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'user', 'order', etc.
    entity_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT[],
    popularity_score DECIMAL(3,2) DEFAULT 0.0,
    last_indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    user_id INTEGER,
    results_count INTEGER,
    clicked_result_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100)
);

-- =====================================================
-- CACHE SERVICE TABLES
-- =====================================================

-- Cache entries table
CREATE TABLE IF NOT EXISTS cache_entries (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP
);

-- Cache statistics table
CREATE TABLE IF NOT EXISTS cache_statistics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    evictions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- QUEUE SERVICE TABLES
-- =====================================================

-- Job queue table
CREATE TABLE IF NOT EXISTS job_queue (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Job dependencies table
CREATE TABLE IF NOT EXISTS job_dependencies (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) REFERENCES job_queue(job_id) ON DELETE CASCADE,
    depends_on_job_id VARCHAR(100) REFERENCES job_queue(job_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LOGGING SERVICE TABLES
-- =====================================================

-- Application logs table
CREATE TABLE IF NOT EXISTS application_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL, -- 'debug', 'info', 'warn', 'error'
    message TEXT NOT NULL,
    context JSONB,
    service VARCHAR(50),
    user_id INTEGER,
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(100)
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    service VARCHAR(50),
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT false
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Auth service indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Payment service indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- Inventory service indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);

-- Analytics service indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);

-- Notification service indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Order service indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Search service indexes
CREATE INDEX IF NOT EXISTS idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_index_keywords ON search_index USING GIN(keywords);

-- Cache service indexes
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);

-- Queue service indexes
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC, scheduled_at ASC);

-- Logging service indexes
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTIONS (for testing)
-- =====================================================

-- Insert sample users
INSERT INTO users (username, email, password_hash) VALUES 
('testuser1', 'user1@example.com', 'hashed_password_1'),
('testuser2', 'user2@example.com', 'hashed_password_2'),
('testuser3', 'user3@example.com', 'hashed_password_3')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO products (sku, name, description, price, category) VALUES 
('PROD-001', 'Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics'),
('PROD-002', 'Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics'),
('PROD-003', 'Desk Chair', 'Comfortable office chair', 199.99, 'Furniture')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample inventory
INSERT INTO inventory (product_id, warehouse_location, quantity_available) VALUES 
(1, 'WH-001', 100),
(2, 'WH-001', 500),
(3, 'WH-002', 50)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User with profile view
CREATE OR REPLACE VIEW user_profiles_complete AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    up.first_name,
    up.last_name,
    up.phone,
    up.avatar_url
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- Order with items view
CREATE OR REPLACE VIEW orders_complete AS
SELECT 
    o.order_id,
    o.user_id,
    o.status,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.user_id, o.status, o.total_amount, o.created_at;

-- =====================================================
-- STORED PROCEDURES FOR BUSINESS LOGIC
-- =====================================================

-- Reserve inventory procedure
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_product_id INTEGER,
    p_quantity INTEGER,
    p_order_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    current_quantity INTEGER;
BEGIN
    -- Get current available quantity
    SELECT quantity_available - quantity_reserved 
    INTO current_quantity
    FROM inventory 
    WHERE product_id = p_product_id;
    
    -- Check if enough inventory is available
    IF current_quantity < p_quantity THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve the inventory
    UPDATE inventory 
    SET quantity_reserved = quantity_reserved + p_quantity
    WHERE product_id = p_product_id;
    
    -- Create reservation record
    INSERT INTO inventory_reservations (product_id, order_id, quantity, expires_at)
    VALUES (p_product_id, p_order_id, p_quantity, CURRENT_TIMESTAMP + INTERVAL '1 hour');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION
-- =====================================================

-- This schema provides a complete foundation for all 20 microservices
-- Each service has its own tables with proper relationships and indexes
-- The schema is optimized for performance with appropriate indexes
-- Sample data is included for immediate testing
-- Views and stored procedures provide common functionality

COMMENT ON SCHEMA public IS 'Ultimate Production Demo - Complete Microservices Database Schema';
