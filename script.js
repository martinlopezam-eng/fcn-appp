function normalizePhone(raw) {
  return raw.replace(/[^\d+]/g, "");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(u) {
  localStorage.setItem("currentUser", JSON.stringify(u));
}
