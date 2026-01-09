-- Database Schema for Projeto SOFIS
-- Compatible with PostgreSQL

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_changetimestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
  role VARCHAR(20) NOT NULL DEFAULT 'TECNICO' CHECK (role IN ('ADMINISTRADOR', 'ANALISTA', 'TECNICO')),
  permissions JSONB, -- Stores custom permissions structure
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_changetimestamp_column();

-- --------------------------------------------------------
-- Table: role_permissions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  UNIQUE(role_name, module)
);

-- Default Admin User (Password: admin123 - CHANGE THIS ON PRODUCTION)
-- Hash generated for 'admin123'
INSERT INTO users (username, full_name, password_hash, role) VALUES
('admin', 'Administrador do Sistema', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMINISTRADOR')
ON CONFLICT (username) DO NOTHING;

-- --------------------------------------------------------
-- Table: clients
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  document VARCHAR(20), -- CPF/CNPJ
  contacts JSONB, -- Storing complex contact arrays as JSON for compatibility
  servers JSONB, -- Storing server/vpn/url info as JSON for compatibility
  vpns JSONB,
  urls JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_changetimestamp_column();

-- --------------------------------------------------------
-- Table: version_controls
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS version_controls (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL,
  system VARCHAR(50) NOT NULL, -- 'Hemote Plus', 'Hemote Web', etc.
  version VARCHAR(50) NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'producao' CHECK (environment IN ('producao', 'homologacao')),
  updated_at TIMESTAMP NOT NULL,
  responsible VARCHAR(100),
  notes TEXT,
  has_alert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: version_history
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS version_history (
  id SERIAL PRIMARY KEY,
  version_control_id INT NOT NULL,
  previous_version VARCHAR(50),
  new_version VARCHAR(50) NOT NULL,
  updated_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (version_control_id) REFERENCES version_controls(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: audit_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  operation_type VARCHAR(50), -- 'CRIACAO', 'EDICAO', 'EXCLUSAO'
  action VARCHAR(255),
  details TEXT,
  client_name VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  version_type VARCHAR(50) DEFAULT 'Pacote', -- 'Pacote' or 'Build'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: user_favorites
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  client_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, client_id)
);
