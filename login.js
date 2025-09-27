document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msgEl = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const invite = document.getElementById("invite").value.trim();

    if (!phone || !password) {
      msgEl.textContent = "Número y contraseña obligatorios";
      return;
    }
    if (password.length < 6) {
      msgEl.textContent = "La contraseña debe tener mínimo 6 caracteres";
      return;
    }

    try {
      // Intentar login primero
      let res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      let data = await res.json();

      if (res.ok) {
        localStorage.setItem("currentUser", JSON.stringify(data));
        location.href = "home.html";
      } else {
        // Si no existe, registrar
        msgEl.textContent = "Usuario no encontrado, creando cuenta...";
        res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, password, invite })
        });
        data = await res.json();

        if (res.ok) {
          localStorage.setItem("currentUser", JSON.stringify(data));
          setTimeout(() => location.href = "home.html", 800);
        } else {
          msgEl.textContent = data.error || "Error al registrar";
        }
      }
    } catch (err) {
      console.error(err);
      msgEl.textContent = "Error de conexión con el servidor";
    }
  });
});

async function comprar(id) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: u.phone, productId: id })
  });
  const data = await res.json();

  if (res.ok) {
    alert(`✅ Orden creada\n\nProducto: ${data.producto}\nMonto: COP ${data.monto.toLocaleString()}\n\nRealiza el pago a: ${data.cuenta}`);
  } else {
    alert(data.error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msgEl = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const invite = document.getElementById("invite").value.trim();

    let url = "/api/login";
    let body = { phone, password };

    // Intentar login primero
    let res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let data = await res.json();

    if (data.error) {
      // Si no existe → registrar
      let res2 = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, invite })
      });
      data = await res2.json();
    }

    if (data.error) {
      msgEl.textContent = data.error;
    } else {
      localStorage.setItem("currentUser", JSON.stringify(data));
      location.href = "home.html";
    }
  });
});
