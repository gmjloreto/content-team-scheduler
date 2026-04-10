import { supabase } from "../config/supabase.js";

const loginDiv = document.getElementById("login");
const painelDiv = document.getElementById("painel");

const btnLogin = document.getElementById("btnLogin");
const btnCriar = document.getElementById("btnCriar");

// 🔐 sessão
const { data: { session } } = await supabase.auth.getSession();

if (session) liberarPainel();

// 🔥 LOGIN
btnLogin.onclick = async () => {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert("Login inválido");
    return;
  }

  liberarPainel();
};

// 🔓 liberar painel
function liberarPainel() {
  loginDiv.style.display = "none";
  painelDiv.style.display = "block";
  carregar();
}

// 🧠 helper
function formatarData(data) {
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

// 📦 carregar eventos
async function carregar() {
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .order("dia", { ascending: true });

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(e => {
    const div = document.createElement("div");

    const dataBonita = formatarData(e.dia);

    div.innerHTML = `
      ${dataBonita} - ${e.evento}
      <button onclick="remover('${e.id}')">❌</button>
    `;

    lista.appendChild(div);
  });
}

// ➕ criar evento
const inputDia = document.getElementById("dia");

  inputDia.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);

    if (v.length >= 5)
      v = v.replace(/(\d{2})(\d{2})(\d+)/, "$1/$2/$3");
    else if (v.length >= 3)
      v = v.replace(/(\d{2})(\d+)/, "$1/$2");

    e.target.value = v;
});

function validarDataBR(data) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return false;

  const [dia, mes, ano] = data.split("/").map(Number);

  const dataObj = new Date(ano, mes - 1, dia);

  return (
    dataObj.getFullYear() === ano &&
    dataObj.getMonth() === mes - 1 &&
    dataObj.getDate() === dia
  );
}

function brToISO(data) {
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
}

btnCriar.onclick = async () => {
const diaBR = document.getElementById("dia").value;

  if (!validarDataBR(diaBR)) {
    return alert("Data inválida");
  }

const dia = brToISO(diaBR);

    if (!dia) return alert("Use formato DD/MM/AAAA");

  const evento = document.getElementById("evento").value;

  if (!dia || !evento) return alert("Preencha tudo");

  await supabase.from("eventos").insert({ dia, evento });

  carregar();
};

// ❌ remover
window.remover = async (id) => {
  const ok = confirm("Tem certeza?");
  if (!ok) return;

  await supabase.from("eventos").delete().eq("id", id);
  carregar();
};

// 🔓 logout
document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};