const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      name,
      category,
      description,
      sale_type,
      price,
      promo_text,
      image_url,
      stock
    } = req.body;

    if (!name || !category || !description || !sale_type || !image_url || !stock) {
      return res.status(400).json({
        error: "Todos los campos obligatorios deben completarse"
      });
    }

    const validSaleTypes = ["normal", "combo", "promo"];
    if (!validSaleTypes.includes(sale_type)) {
      return res.status(400).json({
        error: "Tipo de venta inválido"
      });
    }

    const validStock = ["disponible", "agotado"];
    if (!validStock.includes(stock)) {
      return res.status(400).json({
        error: "Estado de stock inválido"
      });
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        name,
        category,
        description,
        sale_type,
        price,
        promo_text,
        image_url,
        stock
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category,
      description,
      sale_type,
      price || null,
      promo_text || null,
      image_url,
      stock
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: "Producto creado correctamente"
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      sale_type,
      price,
      promo_text,
      image_url,
      stock
    } = req.body;

    const existingProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    if (!existingProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (!name || !category || !description || !sale_type || !image_url || !stock) {
      return res.status(400).json({
        error: "Todos los campos obligatorios deben completarse"
      });
    }

    const validSaleTypes = ["normal", "combo", "promo"];
    if (!validSaleTypes.includes(sale_type)) {
      return res.status(400).json({
        error: "Tipo de venta inválido"
      });
    }

    const validStock = ["disponible", "agotado"];
    if (!validStock.includes(stock)) {
      return res.status(400).json({
        error: "Estado de stock inválido"
      });
    }

    db.prepare(`
      UPDATE products
      SET
        name = ?,
        category = ?,
        description = ?,
        sale_type = ?,
        price = ?,
        promo_text = ?,
        image_url = ?,
        stock = ?
      WHERE id = ?
    `).run(
      name,
      category,
      description,
      sale_type,
      price || null,
      promo_text || null,
      image_url,
      stock,
      id
    );

    res.json({
      message: "Producto actualizado correctamente"
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    if (!existingProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(id);

    res.json({
      message: "Producto eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;