-- Initialize database for Caro Online
CREATE DATABASE IF NOT EXISTS caro_online;
USE caro_online;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'caro_user'@'%' IDENTIFIED BY 'caro_password';
GRANT ALL PRIVILEGES ON caro_online.* TO 'caro_user'@'%';
FLUSH PRIVILEGES;
