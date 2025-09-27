document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    location.href = "admin-login.html";
    return;
  }

  const ordenesBody = document.getElementById("ordenes");
  const retirosBody = document.getElementById("retiros");
  const usuariosBody = document.getElementById("usuarios");

  function renderEstado(estado) {
    let clase = "status-pendiente";
    if (estado === "aprobada" || estado === "aprobado") clase = "status-aprobada";
    if (estado === "rechazada" || estado === "rechazado") clase = "status-rechazada";
    return `<span class="status ${clase}">${estado}</span>`;
  }

  // ---- Órdenes ----
  async function cargarOrdenes() {
    let res = await fetch("/api/admin/ordenes");
    let data = await res.json();
    ordenesBody.innerHTML = "";

    if (data.length === 0) {
      ordenesBody.innerHTML = `<tr><td colspan="6" class="empty">No hay órdenes pendientes</td></tr>`;
      return;
    }

    data.forEach(o => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.id}</td>
        <td>${o.phone}</td>
        <td>${o.producto}</td>
        <td>COP ${o.monto.toLocaleString()}</td>
        <td>${renderEstado(o.estado)}</td>
        <td>
          <button class="btn-approve" onclick="accionOrden(${o.id}, 'aprobar')">Aprobar</button>
          <button class="btn-reject" onclick="accionOrden(${o.id}, 'rechazar')">Rechazar</button>
        </td>
      `;
      ordenesBody.appendChild(tr);
    });
  }

  // ---- Retiros ----
  async function cargarRetiros() {
    let res = await fetch("/api/admin/retiros");
    let data = await res.json();
    retirosBody.innerHTML = "";

    if (data.length === 0) {
      retirosBody.innerHTML = `<tr><td colspan="5" class="empty">No hay retiros pendientes</td></tr>`;
      return;
    }

    data.forEach(r => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.phone}</td>
        <td>COP ${r.monto.toLocaleString()}</td>
        <td>${renderEstado(r.estado)}</td>
        <td>
          <button class="btn-approve" onclick="accionRetiro(${r.id}, 'aprobar')">Aprobar</button>
          <button class="btn-reject" onclick="accionRetiro(${r.id}, 'rechazar')">Rechazar</button>
        </td>
      `;
      retirosBody.appendChild(tr);
    });
  }

  // ---- Usuarios ----
  async function cargarUsuarios() {
    let res = await fetch("/api/admin/usuarios");
    let data = await res.json();
    usuariosBody.innerHTML = "";

    if (data.length === 0) {
      usuariosBody.innerHTML = `<tr><td colspan="6" class="empty">No hay usuarios registrados</td></tr>`;
      return;
    }

    data.forEach(u => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.name || "Sin nombre"}</td>
        <td>${u.phone}</td>
        <td>COP ${u.saldo.toLocaleString()}</td>
        <td>COP ${u.ingresos.toLocaleString()}</td>
        <td>${u.inviteCode}</td>
      `;
      usuariosBody.appendChild(tr);
    });
  }

  // ---- Acciones ----
  window.accionOrden = async (id, accion) => {
    await fetch(`/api/admin/ordenes/${id}/accion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion })
    });
    cargarOrdenes();
  };

  window.accionRetiro = async (id, accion) => {
    await fetch(`/api/admin/retiros/${id}/accion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion })
    });
    cargarRetiros();
  };

  // ---- Cargar todo al inicio ----
  cargarOrdenes();
  cargarRetiros();
  cargarUsuarios();
});
