document.addEventListener("DOMContentLoaded", () => {
  const u = getCurrentUser();
  if (!u) { location.href = "login.html"; return; }

  // Mostrar datos usuario
  document.getElementById("userPhone").textContent = u.phone;
  document.getElementById("perfilNombre").textContent = u.name || "Usuario";
  document.getElementById("perfilTelefono").textContent = u.phone;
  document.getElementById("perfilSaldo").textContent = u.saldo || 0;
  document.getElementById("inviteCode").textContent = u.inviteCode;
  document.getElementById("ingresosTotales").textContent = u.ingresos || 0;

  // Productos disponibles
  const productos = [
    { id: 1, nombre: "Fondo Bienestar", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Nedbank_logo.svg/320px-Nedbank_logo.svg.png", monto: 15000, validez: 60, tasa: "25%", ingresoDiario: 3750, ingresoTotal: 225000 },
    { id: 2, nombre: "Plan Premium", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Google-flutter-logo.svg/320px-Google-flutter-logo.svg.png", monto: 30000, validez: 60, tasa: "27%", ingresoDiario: 8100, ingresoTotal: 486000 },
    { id: 3, nombre: "Inversión Oro", img: "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg", monto: 250000, validez: 60, tasa: "29%", ingresoDiario: 17400, ingresoTotal: 1044000 },
    { id: 4, nombre: "Inversión Platino", img: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Platinum_crystal_bar.png", monto: 120000, validez: 60, tasa: "31%", ingresoDiario: 37200, ingresoTotal: 2232000 },
    { id: 5, nombre: "Inversión Diamante", img: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Diamond_icon.svg", monto: 240000, validez: 60, tasa: "33%", ingresoDiario: 79200, ingresoTotal: 4752000 }
  ];

  const productosDiv = document.getElementById("productos");
  const misInversionesDiv = document.getElementById("misInversiones");

  // Renderizar productos
  function renderProductos() {
    productosDiv.innerHTML = "";
    productos.forEach(p => {
      let d = document.createElement("div");
      d.className = "producto";
      d.innerHTML = `
        <img src="${p.img}" alt="${p.nombre}" />
        <div class="producto-info">
          <h4>${p.nombre}</h4>
          <p><b>Monto:</b> COP ${p.monto.toLocaleString()}</p>
          <p><b>Validez:</b> ${p.validez} días</p>
          <p><b>Tasa:</b> ${p.tasa}</p>
          <p><b>Ingreso diario:</b> COP ${p.ingresoDiario.toLocaleString()}</p>
          <p><b>Ingreso total:</b> COP ${p.ingresoTotal.toLocaleString()}</p>
          <button data-id="${p.id}" class="btn small">Comprar</button>
        </div>
      `;
      productosDiv.appendChild(d);
    });
    productosDiv.querySelectorAll("button").forEach(b => {
      b.onclick = () => comprar(parseInt(b.dataset.id));
    });
  }

  // Renderizar inversiones con barra de progreso
  function renderInversiones() {
    misInversionesDiv.innerHTML = "";
    if (!u.inversiones.length) {
      misInversionesDiv.textContent = "Sin inversiones";
      return;
    }

    let hoy = new Date();

    u.inversiones.forEach((p, idx) => {
      let card = document.createElement("div");
      card.className = "inversion-card";

      if (!p.progreso) p.progreso = 0;
      if (!p.cobrado) p.cobrado = 0;
      if (!p.ultimaCobranza) p.ultimaCobranza = hoy.toISOString();

      let ultima = new Date(p.ultimaCobranza);
      let diffDias = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));

      if (diffDias > 0 && p.progreso < 100) {
        let diasPendientes = Math.min(diffDias, p.validez - p.cobrado);

        u.saldo += p.ingresoDiario * diasPendientes;
        u.ingresos = (u.ingresos || 0) + p.ingresoDiario * diasPendientes;

        p.cobrado += diasPendientes;
        p.progreso = Math.min(100, (p.cobrado / p.validez) * 100);
        p.ultimaCobranza = hoy.toISOString();

        saveUsers(getUsers().map(x => x.phone === u.phone ? u : x));
        setCurrentUser(u);
      }

      card.innerHTML = `
        <img src="${p.img}" alt="${p.nombre}" />
        <div class="inversion-info">
          <p class="label">Producto</p><p class="valor">${p.nombre}</p>
          <p class="label">Monto invertido</p><p class="valor">COP ${p.monto.toLocaleString()}</p>
          <p class="label">Ingreso diario</p><p class="valor">COP ${p.ingresoDiario.toLocaleString()}</p>
          <p class="label">Ingreso total</p><p class="valor">COP ${p.ingresoTotal.toLocaleString()}</p>
          <div class="progress-bar">
            <div class="progress" style="width:${p.progreso}%"></div>
          </div>
          <button class="btn small cobrar-btn" data-idx="${idx}">Cobrar ingreso diario</button>
        </div>
      `;

      misInversionesDiv.appendChild(card);
    });

    document.querySelectorAll(".cobrar-btn").forEach(btn => {
      btn.onclick = () => {
        let i = parseInt(btn.dataset.idx);
        let inv = u.inversiones[i];

        if (inv.cobrado < inv.validez) {
          u.saldo += inv.ingresoDiario;
          u.ingresos = (u.ingresos || 0) + inv.ingresoDiario;
          inv.cobrado += 1;
          inv.progreso = Math.min(100, (inv.cobrado / inv.validez) * 100);
          inv.ultimaCobranza = new Date().toISOString();
        }

        saveUsers(getUsers().map(x => x.phone === u.phone ? u : x));
        setCurrentUser(u);

        document.getElementById("perfilSaldo").textContent = u.saldo;
        renderInversiones();
      };
    });

    document.getElementById("perfilSaldo").textContent = u.saldo;
  }

  // Comprar producto
  function comprar(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return alert("Producto no encontrado");

    // Simular orden pendiente con QR fijo
    alert("Redirigiendo al QR de pago...");
    window.location.href = "qr.html"; // página del QR fijo
  }

  // Retiro
  document.getElementById("withdrawBtn").onclick = () => {
    const nequi = document.getElementById("nequiPhone").value.trim();
    const amount = parseInt(document.getElementById("withdrawAmount").value, 10);

    if (!nequi || !amount || amount <= 0) {
      alert("Ingresa número y monto válido");
      return;
    }

    if (amount > u.saldo) {
      alert("Saldo insuficiente");
      return;
    }

    alert(`Solicitud enviada: ${amount} COP a Nequi ${nequi}`);
    // En el backend/admin se debería registrar y aprobar
  };

  // Logout
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("currentUser");
    location.href = "login.html";
  };

  // Navegación
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById(btn.dataset.view).classList.add("active");
    };
  });

  renderProductos();
  renderInversiones();
});
