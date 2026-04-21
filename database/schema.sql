DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  sale_type TEXT NOT NULL CHECK(sale_type IN ('normal', 'combo', 'promo')),
  price REAL,
  promo_text TEXT,
  image_url TEXT NOT NULL,
  stock TEXT NOT NULL CHECK(stock IN ('disponible', 'agotado')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);