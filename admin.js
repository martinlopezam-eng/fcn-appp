document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("ordenesTabla");

  function cargarOrdenes() {
    fetch("/api/ordenes")
      .then(r => r.json())
      .then(data => {
        tabla.innerHTML = "";
        data.forEach(o => {
          let tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${o.id}</td>
            <td>${o.phone}</td>
            <td>${o.producto.nombre}</td>
            <td>${o.producto.monto.toLocaleString("es-CO")}</td>
            <td>${o.estado}</td>
            <td>
              ${o.estado === "pendiente" ? `
                <button onclick="accion('${o.id}','aceptar')">Aceptar</button>
                <button onclick="accion('${o.id}','rechazar')">Rechazar</button>
              ` : o.estado}
            </td>
          `;
          tabla.appendChild(tr);
        });
      });
  }

  window.accion = function(id, tipo) {
    fetch(`/api/ordenes/${id}/${tipo}`, { method: "POST" })
      .then(r => r.json())
      .then(() => cargarOrdenes());
  };

  cargarOrdenes();
});
