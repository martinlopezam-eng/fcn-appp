const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// --- Archivos de datos ---
const USERS_FILE = path.join(__dirname, "data", "users.json");
const ORDERS_FILE = path.join(__dirname, "data", "orders.json");

// --- Helpers ---
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// ========================
// RUTAS DE USUARIO
// ========================
app.post("/api/register", (req, res) => {
  let users = readJSON(USERS_FILE);
  const { phone, password } = req.body;

  if (users.find(u => u.phone === phone)) {
    return res.json({ ok: false, msg: "Usuario ya existe" });
  }

  const newUser = {
    phone,
    password,
    saldo: 0,
    ingresos: 3000, // bono de registro
    inviteCode: "FCN" + Math.floor(Math.random() * 100000),
    inversiones: []
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.json({ ok: true, user: newUser });
});

app.post("/api/login", (req, res) => {
  let users = readJSON(USERS_FILE);
  const { phone, password } = req.body;

  const u = users.find(x => x.phone === phone && x.password === password);
  if (!u) return res.json({ ok: false, msg: "Credenciales inválidas" });

  res.json({ ok: true, user: u });
});

// ========================
// RUTAS DE ÓRDENES
// ========================

// Crear orden (desde Comprar en home.js)
app.post("/api/crear-orden", (req, res) => {
  let orders = readJSON(ORDERS_FILE);
  const { phone, productoId, productoObj } = req.body;

  const nuevaOrden = {
    id: uuidv4(),
    phone,
    producto: productoObj,
    estado: "pendiente",
    fecha: new Date().toISOString()
  };

  orders.push(nuevaOrden);
  writeJSON(ORDERS_FILE, orders);

  res.json({
    ok: true,
    orderId: nuevaOrden.id,
    qrPage: `/qr.html?orderId=${nuevaOrden.id}`
  });
});

// Listar todas las órdenes (para admin)
app.get("/api/ordenes", (req, res) => {
  let orders = readJSON(ORDERS_FILE);
  res.json(orders);
});

// Aceptar orden
app.post("/api/ordenes/:id/aceptar", (req, res) => {
  let orders = readJSON(ORDERS_FILE);
  let users = readJSON(USERS_FILE);
  const orderId = req.params.id;

  let orden = orders.find(o => o.id === orderId);
  if (!orden) return res.json({ ok: false, msg: "Orden no encontrada" });

  orden.estado = "aprobada";

  // Agregar inversión al usuario
  let u = users.find(x => x.phone === orden.phone);
  if (u) {
    u.inversiones.push({
      ...orden.producto,
      progreso: 0,
      cobrado: 0,
      ultimaCobranza: new Date().toISOString()
    });
  }

  writeJSON(ORDERS_FILE, orders);
  writeJSON(USERS_FILE, users);

  res.json({ ok: true, msg: "Orden aprobada" });
});

// Rechazar orden
app.post("/api/ordenes/:id/rechazar", (req, res) => {
  let orders = readJSON(ORDERS_FILE);
  const orderId = req.params.id;

  let orden = orders.find(o => o.id === orderId);
  if (!orden) return res.json({ ok: false, msg: "Orden no encontrada" });

  orden.estado = "rechazada";

  writeJSON(ORDERS_FILE, orders);

  res.json({ ok: true, msg: "Orden rechazada" });
});

// ========================
// SERVIDOR
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

