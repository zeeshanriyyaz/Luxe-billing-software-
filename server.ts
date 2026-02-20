import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("pos.db");

// Initialize Database with tables for users, products, and sales
db.exec(`
  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  -- Products table for inventory management
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price REAL,
    stock INTEGER,
    min_stock INTEGER DEFAULT 5
  );

  -- Sales table to track transactions
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL,
    tax REAL,
    discount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Sale items table to track individual products in each sale
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Seed admin user if not exists
const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!admin) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, category, price, stock, min_stock } = req.body;
    const result = db.prepare("INSERT INTO products (name, category, price, stock, min_stock) VALUES (?, ?, ?, ?, ?)").run(name, category, price, stock, min_stock || 5);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category, price, stock, min_stock } = req.body;
    db.prepare("UPDATE products SET name = ?, category = ?, price = ?, stock = ?, min_stock = ? WHERE id = ?").run(name, category, price, stock, min_stock, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Sales
  app.post("/api/sales", (req, res) => {
    const { items, total, tax, discount } = req.body;
    
    const transaction = db.transaction(() => {
      const saleResult = db.prepare("INSERT INTO sales (total, tax, discount) VALUES (?, ?, ?)").run(total, tax, discount);
      const saleId = saleResult.lastInsertRowid;

      for (const item of items) {
        db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)").run(saleId, item.id, item.quantity, item.price);
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.id);
      }
      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ success: true, saleId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all();
    res.json(sales);
  });

  app.get("/api/stats", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    const todaySales = db.prepare("SELECT SUM(total) as total FROM sales WHERE date(created_at) = ?").get(today).total || 0;
    const monthSales = db.prepare("SELECT SUM(total) as total FROM sales WHERE strftime('%Y-%m', created_at) = ?").get(month).total || 0;
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
    const recentTransactions = db.prepare("SELECT * FROM sales ORDER BY created_at DESC LIMIT 5").all();

    res.json({
      todaySales,
      monthSales,
      totalProducts,
      recentTransactions
    });
  });

  app.get("/api/reports/daily", (req, res) => {
    const data = db.prepare(`
      SELECT date(created_at) as date, SUM(total) as revenue 
      FROM sales 
      GROUP BY date(created_at) 
      ORDER BY date DESC 
      LIMIT 30
    `).all();
    res.json(data);
  });

  // Get sales distribution by category
  app.get("/api/reports/categories", (req, res) => {
    const data = db.prepare(`
      SELECT p.category as name, SUM(si.quantity) as value
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.category
    `).all();
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
