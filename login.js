document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msgEl = document.getElementById("message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = normalizePhone(document.getElementById("phone").value.trim());
    const password = document.getElementById("password").value;
    const invite = document.getElementById("invite").value.trim();

    if (!phone || !password) {
      msgEl.textContent = "Número y contraseña obligatorios";
      return;
    }
    if (password.length < 6) {
      msgEl.textContent = "La contraseña debe tener mínimo 6 caracteres";
      return;
    }

    let users = getUsers();
    let existing = users.find(u => normalizePhone(u.phone) === phone);

    if (existing) {
      if (existing.password !== password) {
        msgEl.textContent = "Contraseña incorrecta";
        return;
      }
      msgEl.textContent = "Iniciando sesión...";
      setCurrentUser(existing);
      setTimeout(() => location.href = "home.html", 800);
    } else {
      msgEl.textContent = "Creando cuenta... Iniciando sesión";

      let inviteCode = phone + "-FCN";
      let newUser = { 
        name, 
        phone, 
        password, 
        invite, 
        saldo:3000, 
        ingresos:3000, 
        inversiones:[], 
        inviteCode 
      };

      if (invite) {
        let inviter = users.find(u => u.inviteCode === invite);
        if (inviter) {
          inviter.ingresos += 10000;
          inviter.saldo += 10000;
        }
      }

      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      setTimeout(() => location.href = "home.html", 1000);
    }
  });
});
