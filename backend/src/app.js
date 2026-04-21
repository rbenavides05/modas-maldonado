const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const productsRoutes = require("./routes/products");
const uploadRoutes = require("./routes/upload");
const authRoutes = require("./routes/auth");
const { requireAdmin } = require("./middleware/auth");

require("./db/connection");

const app = express();
const PORT = 3000;

const FRONTEND_PATH = path.join(__dirname, "../../fronted");
const UPLOADS_PATH = path.join(__dirname, "../uploads");

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: "modas-maldonado-admin-secret-2026",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  }
}));

app.use("/uploads", express.static(UPLOADS_PATH));
app.use("/api/auth", authRoutes);

/* públicas */
app.use("/api/products", (req, res, next) => {
  if (req.method === "GET") return next();
  return requireAdmin(req, res, next);
}, productsRoutes);

app.use("/api/upload", requireAdmin, uploadRoutes);

/* servir frontend */
app.use(express.static(FRONTEND_PATH));

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

app.get("/admin", (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.sendFile(path.join(FRONTEND_PATH, "admin-login.html"));
  }

  return res.sendFile(path.join(FRONTEND_PATH, "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});