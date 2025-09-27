const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ---- Conexión BD ----
const db = new sqlite3.Database("./fcn.db");

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    password TEXT,
    saldo INTEGER DEFAULT 0,
    ingresos INTEGER DEFAULT 0,
    inviteCode TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    producto TEXT,
    monto INTEGER,
    estado TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS retiros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    monto INTEGER,
    estado TEXT
  )`);
});

// ---- Rutas usuarios ----
app.post("/api/register", async (req, res) => {
  const { name, phone, password, invite } = req.body;
  if (!phone || !password) return res.status(400).json({ error: "Datos incompletos" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const inviteCode = phone + "-FCN";

  db.run(
    `INSERT INTO users (name, phone, password, saldo, ingresos, inviteCode) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, phone, hashedPassword, 3000, 3000, inviteCode],
    function (err) {
      if (err) return res.status(400).json({ error: "Usuario ya existe" });

      // Si tiene invitador, sumarle 10k
      if (invite) {
        db.run(
          `UPDATE users SET saldo = saldo + 10000, ingresos = ingresos + 10000 WHERE inviteCode = ?`,
          [invite]
        );
      }

      res.json({ id: this.lastID, phone, saldo: 3000, ingresos: 3000, inviteCode });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;

  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Contraseña incorrecta" });

    res.json(user);
  });
});

// ---- Productos (fijos en la BD o hardcodeados) ----
const productos = [
  { id: 1, nombre: "Fondo Bienestar", monto: 15000 },
  { id: 2, nombre: "Plan Premium", monto: 30000 },
  { id: 3, nombre: "Inversión Oro", monto: 250000 },
  { id: 4, nombre: "Inversión Platino", monto: 120000 },
  { id: 5, nombre: "Inversión Diamante", monto: 240000 },
];

app.get("/api/productos", (req, res) => res.json(productos));

// ---- Crear orden de compra ----
app.post("/api/comprar", (req, res) => {
  const { phone, productoId } = req.body;
  const prod = productos.find(p => p.id === productoId);
  if (!prod) return res.status(400).json({ error: "Producto inválido" });

  db.run(
    `INSERT INTO orders (phone, producto, monto, estado) VALUES (?, ?, ?, ?)`,
    [phone, prod.nombre, prod.monto, "pendiente"],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al crear orden" });
      res.json({ success: true, orderId: this.lastID });
    }
  );
});

// ---- Retiros ----
app.post("/api/withdraw", (req, res) => {
  const { phone, amount } = req.body;

  if (amount < 50000) return res.status(400).json({ error: "Monto mínimo: 50,000 COP" });

  db.get(`SELECT saldo FROM users WHERE phone = ?`, [phone], (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Usuario no encontrado" });
    if (user.saldo < amount) return res.status(400).json({ error: "Saldo insuficiente" });

    db.run(
      `INSERT INTO retiros (phone, monto, estado) VALUES (?, ?, ?)`,
      [phone, amount, "pendiente"],
      function (err2) {
        if (err2) return res.status(500).json({ error: "Error en retiro" });
        res.json({ success: true, retiroId: this.lastID });
      }
    );
  });
});

// ---- Admin ----
app.post("/api/admin/login", (req, res) => {
  const { user, password } = req.body;
  if (user === "admin" && password === "admin123") {
    res.json({ success: true, token: "admin-token" });
  } else {
    res.status(401).json({ error: "Credenciales inválidas" });
  }
});

app.get("/api/admin/ordenes", (req, res) => {
  db.all(`SELECT * FROM orders WHERE estado = 'pendiente'`, [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/admin/ordenes/:id/accion", (req, res) => {
  const { id } = req.params;
  const { accion } = req.body;

  db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, order) => {
    if (!order) return res.status(404).json({ error: "Orden no encontrada" });

    if (accion === "aprobar") {
      db.run(`UPDATE orders SET estado = 'aprobada' WHERE id = ?`, [id]);
      db.run(`UPDATE users SET saldo = saldo + ? WHERE phone = ?`, [order.monto, order.phone]);
    } else {
      db.run(`UPDATE orders SET estado = 'rechazada' WHERE id = ?`, [id]);
    }
    res.json({ success: true });
  });
});

app.get("/api/admin/retiros", (req, res) => {
  db.all(`SELECT * FROM retiros WHERE estado = 'pendiente'`, [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/admin/retiros/:id/accion", (req, res) => {
  const { id } = req.params;
  const { accion } = req.body;

  db.get(`SELECT * FROM retiros WHERE id = ?`, [id], (err, retiro) => {
    if (!retiro) return res.status(404).json({ error: "Retiro no encontrado" });

    if (accion === "aprobar") {
      db.run(`UPDATE retiros SET estado = 'aprobado' WHERE id = ?`, [id]);
      db.run(`UPDATE users SET saldo = saldo - ? WHERE phone = ?`, [retiro.monto, retiro.phone]);
    } else {
      db.run(`UPDATE retiros SET estado = 'rechazado' WHERE id = ?`, [id]);
    }
    res.json({ success: true });
  });
});

// ---- Puerto ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));

// ---- Listar usuarios ----
app.get("/api/admin/usuarios", (req, res) => {
  db.all(`SELECT id, name, phone, saldo, ingresos, inviteCode FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al cargar usuarios" });
    res.json(rows);
  });
});
