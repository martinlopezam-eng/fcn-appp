document.addEventListener("DOMContentLoaded", () => {
  const u = JSON.parse(localStorage.getItem("currentUser"));
  if (!u) return location.href = "login.html";

  // Render perfil
  async function renderYo() {
    const res = await fetch(`/api/users/${u.phone}`);
    const user = await res.json();
    document.getElementById("perfilNombre").textContent = user.name || "Usuario";
    document.getElementById("perfilTelefono").textContent = user.phone;
    document.getElementById("perfilSaldo").textContent = user.saldo || 0;
    document.getElementById("inviteCode").textContent = user.inviteCode;
    document.getElementById("ingresosTotales").textContent = user.ingresos || 0;
  }

  // Render productos
  async function renderProductos() {
    const res = await fetch("/api/products");
    const productos = await res.json();
    const cont = document.getElementById("productos");
    cont.innerHTML = "";

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
      cont.appendChild(d);
    });

    cont.querySelectorAll("button").forEach(b => {
      b.onclick = () => comprar(b.dataset.id);
    });
  }

  async function comprar(id) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: u.phone, productId: id })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = data.payUrl;
    } else {
      alert(data.error);
    }
  }

  // Render inversiones
  async function renderInversiones() {
    const res = await fetch(`/api/investments/${u.phone}`);
    const inversiones = await res.json();
    const cont = document.getElementById("misInversiones");
    cont.innerHTML = "";

    if (!inversiones.length) {
      cont.textContent = "Sin inversiones";
      return;
    }

    inversiones.forEach(inv => {
      let card = document.createElement("div");
      card.className = "inversion-card";
      card.innerHTML = `
        <img src="https://cdn-icons-png.flaticon.com/512/1029/1029183.png" alt="${inv.producto}" />
        <div class="inversion-info">
          <p><b>Producto:</b> ${inv.producto}</p>
          <p><b>Monto:</b> COP ${inv.monto.toLocaleString()}</p>
          <p><b>Estado:</b> ${inv.estado}</p>
        </div>
      `;
      cont.appendChild(card);
    });
  }

  // Retiro
  document.getElementById("withdrawBtn").onclick = async () => {
    const nequi = document.getElementById("nequiPhone").value.trim();
    const amount = parseInt(document.getElementById("withdrawAmount").value, 10);
    if (!nequi || !amount) return alert("Completa los campos");

    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: u.phone, nequi, monto: amount })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Solicitud enviada");
    } else {
      alert(data.error);
    }
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

      if (btn.dataset.view === "misInversiones") renderInversiones();
      if (btn.dataset.view === "yo") renderYo();
    };
  });

  // Inicial
  renderYo();
  renderProductos();
});

