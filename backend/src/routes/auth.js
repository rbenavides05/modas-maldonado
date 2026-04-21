const express = require("express");
const router = express.Router();

const ADMIN_EMAIL = "admin@modasmaldonado.com";
const ADMIN_PASSWORD = "Modas123*";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminEmail = email;

    return res.json({
      message: "Acceso concedido",
      admin: { email }
    });
  }

  return res.status(401).json({
    error: "Credenciales incorrectas"
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "No se pudo cerrar la sesión"
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      message: "Sesión cerrada correctamente"
    });
  });
});

router.get("/me", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({
      isAdmin: true,
      email: req.session.adminEmail
    });
  }

  return res.status(401).json({
    isAdmin: false
  });
});

module.exports = router;