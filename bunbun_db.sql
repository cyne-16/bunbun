
DROP DATABASE IF EXISTS bunbun_db;
CREATE DATABASE bunbun_db;
USE bunbun_db;

-- Category Table
CREATE TABLE category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(45) NOT NULL
);

INSERT INTO category (description) VALUES
('Wearables'),
('Decor'),
('Customizable');

-- Item Table
CREATE TABLE item (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_name TEXT NOT NULL,
  description MEDIUMTEXT NOT NULL,
  category_id INT NOT NULL,
  sell_price DECIMAL(7,2) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES category(category_id)
);

INSERT INTO item (item_name, description, category_id, sell_price) VALUES
('Crochet Tote Bag', 'Durable and eco-friendly tote bag made from cotton yarn.', 1, 799.00),
('Crochet Coaster Set', 'Handmade set of 4 floral coasters perfect for your coffee table.', 2, 299.00),
('Custom Name Keychain', 'Customizable crochet keychain with your name or initials.', 3, 150.00),
('Crochet Bucket Hat', 'Trendy and breathable hat, perfect for sunny days.', 1, 499.00),
('Mini Plant Hanger', 'Adds boho charm to any room. Ideal for succulents.', 2, 399.00),
('Crochet Pet Sweater', 'Adorable and cozy sweater for small pets.', 3, 599.00);

-- Item Images
CREATE TABLE itemimg (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  img_path VARCHAR(255) NOT NULL,
  FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE CASCADE
);

INSERT INTO itemimg (item_id, img_path) VALUES
(1, './item/images/tote_bag.jpg'),
(2, './item/images/coaster_set.jpg'),
(3, './item/images/keychain.jpg'),
(4, './item/images/bucket_hat.jpg'),
(5, './item/images/plant_hanger.jpg'),
(6, './item/images/pet_sweater.jpg');

-- Stock
CREATE TABLE stock (
  item_id INT NOT NULL,
  quantity INT DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES item(item_id)
);

INSERT INTO stock (item_id, quantity) VALUES
(1, 15),
(2, 30),
(3, 50),
(4, 20),
(5, 25),
(6, 10);

-- Role
CREATE TABLE role (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(45) NOT NULL
);

INSERT INTO role (description) VALUES
('Admin'),
('User');

-- User Status
CREATE TABLE user_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(45) NOT NULL
);

INSERT INTO user_status (status_name) VALUES
('Active'),
('Deactivated');

-- User
CREATE TABLE `user` (
 `user_id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `fname` varchar(45) NOT NULL,
  `lname` varchar(45) NOT NULL,
  `address` varchar(200) NOT NULL,
  `contact_number` varchar(15) NOT NULL,
  `email` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `user_img` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `fname`, `lname`, `address`, `contact_number`, `email`, `password`, `user_img`, `role_id`, `status_id`) VALUES
(1, 'Mary Pauline', 'Calungsod', 'Western Bicutan, Taguig City', '0921-825-5596', 'marypau@gmail.com', '6c7ca345f63f835cb353ff15bd6c5e052ec08e7a', '../user/uploads/pau.jpg', 1, 1),
(2, 'Kimberly', 'Eledia', 'Bagumbayan, Taguig City', '0912-345-6789', 'kimmyeledia@gmail.com', '315f166c5aca63a157f7d41007675cb44a948b33', '../user/uploads/elkim.jpg', 1, 1),
(3, 'Krshmur Chelvin', 'Lacorte', 'Boracay', '0914-789-6523', 'kc@gmail.com', 'e2ea3c6b50c654e7c809c252b97d94386fb283fc', '../user/uploads/kc.jpg', 2, 1),
(4, 'Erica Shelley', 'Peque', 'Cavite', '0998-745-6321', 'ericapeque98@gmail.com', '80dae43ddfcfbd7a5e75b83260eab8fd35fd6778', '../user/uploads/shelley.jpg', 2, 1),
(5, 'Kathleen Mae', 'Priol', 'Ususan, Taguig City', '0932-145-6987', 'kathleenmpriol@gmail.com', '6df036de595c98ba47361a68c18f0fa2f97854ed', '../user/uploads/kath.png', 2, 1),
(6, 'Maria Kimberly', 'Labi-labi', 'North Signal, Taguig City', '0925-896-3147', 'labilabikim13@gmail.com', '9264deb662735da0309e56db556e36ceae25278e', '../user/uploads/emkim.jpg', 2, 1),
(7, 'Sharwin John', 'Marbella', 'Seoul, South Korea', '0987-456-1230', 'marbellashawrinjohn@gmail.com', 'bf3dab9d79bb0451c24b615d245ac0295407b023', '../user/uploads/shar.jpg', 2, 1),
(8, 'Ylkz', 'Peter', 'Tacloban City', '0987-456-1236', 'ylkzpeter@gmail.com', '88fd21a7683b39d37e45e40cd74ce1f106704f55', '../user/uploads/♡.jpg', 2, 1);

-- Shipping
CREATE TABLE shipping (
  shipping_id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(45) NOT NULL,
  rate DECIMAL(7,2) NOT NULL
);

INSERT INTO shipping (region, rate) VALUES
('Metro Manila', 50.00),
('Luzon', 70.00),
('Visayas', 90.00),
('Mindanao', 110.00);

-- Order Status
CREATE TABLE status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(45) NOT NULL
);

INSERT INTO status (status) VALUES
('Pending'),
('Shipped'),
('Delivered'),
('Cancelled');

-- Order Info
CREATE TABLE orderinfo (
  orderinfo_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date_placed DATE NOT NULL,
  date_shipped DATE,
  date_received DATE,
  status_id INT NOT NULL,
  shipping_id INT,
  FOREIGN KEY (user_id) REFERENCES user(user_id),
  FOREIGN KEY (status_id) REFERENCES status(status_id),
  FOREIGN KEY (shipping_id) REFERENCES shipping(shipping_id)
);

-- Order Line
CREATE TABLE orderline (
  orderinfo_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (orderinfo_id) REFERENCES orderinfo(orderinfo_id),
  FOREIGN KEY (item_id) REFERENCES item(item_id)
);

-- Review
CREATE TABLE review (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  orderinfo_id INT NOT NULL,
  user_id INT NOT NULL,
  rate INT NOT NULL,
  comment VARCHAR(255),
  FOREIGN KEY (orderinfo_id) REFERENCES orderinfo(orderinfo_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);

-- Review Image
CREATE TABLE reviewimg (
  reviewimg_id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  img_path VARCHAR(255) NOT NULL,
  FOREIGN KEY (review_id) REFERENCES review(review_id)
);

-- View: item_details
CREATE VIEW item_details AS
SELECT
  i.item_id,
  i.item_name,
  i.description,
  c.description AS category,
  i.sell_price,
  s.quantity,
  GROUP_CONCAT(ii.img_path ORDER BY ii.img_path ASC SEPARATOR ',') AS images
FROM item i
LEFT JOIN category c ON i.category_id = c.category_id
LEFT JOIN stock s ON i.item_id = s.item_id
LEFT JOIN itemimg ii ON i.item_id = ii.item_id
GROUP BY i.item_id;

-- View: orderdetails
CREATE VIEW orderdetails AS
SELECT
  o.orderinfo_id,
  u.user_id,
  CONCAT(u.fname, ' ', u.lname) AS full_name,
  u.address,
  u.contact_number,
  GROUP_CONCAT(i.item_id ORDER BY i.item_id ASC SEPARATOR ', ') AS item_ids,
  GROUP_CONCAT(i.item_name ORDER BY i.item_id ASC SEPARATOR ', ') AS items,
  GROUP_CONCAT(CAST(i.sell_price AS DECIMAL(10,2)) ORDER BY i.item_id ASC SEPARATOR ', ') AS sell_prices,
  GROUP_CONCAT(ol.quantity ORDER BY i.item_id ASC SEPARATOR ', ') AS quantities,
  GROUP_CONCAT(CAST(ol.quantity * i.sell_price AS DECIMAL(10,2)) ORDER BY i.item_id ASC SEPARATOR ', ') AS subtotals,
  sh.region AS shipping_region,
  sh.rate AS shipping_rate,
  o.date_placed,
  o.date_shipped,
  o.date_received,
  s.status,
  FORMAT(SUM(ol.quantity * i.sell_price + sh.rate), 2) AS total_amount
FROM orderinfo o
JOIN user u ON o.user_id = u.user_id
JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
JOIN item i ON ol.item_id = i.item_id
JOIN shipping sh ON o.shipping_id = sh.shipping_id
JOIN status s ON o.status_id = s.status_id
GROUP BY o.orderinfo_id;

