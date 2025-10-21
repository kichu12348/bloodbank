-- SQL schema for Blood Bank Management System

-- Table: donors
CREATE TABLE IF NOT EXISTS donors (
  donor_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  city VARCHAR(100) NOT NULL,
  last_donation_date DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: blood_stock
CREATE TABLE IF NOT EXISTS blood_stock (
  bag_id INT PRIMARY KEY AUTO_INCREMENT,
  donor_id INT,
  blood_group VARCHAR(5) NOT NULL,
  donation_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available',
  CONSTRAINT fk_blood_stock_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
