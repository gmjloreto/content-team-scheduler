import { supabase } from "../config/supabase.js";
import { toast } from "../js/toast.js";
import { dialog } from "../js/dialog.js";

const loginDiv = document.getElementById("login");
const painelDiv = document.getElementById("painel");

const btnLogin = document.getElementById("btnLogin");
const btnCriar = document.getElementById("btnCriar");

const { data: { session } } = await supabase.auth.getSession();
if (session) liberarPainel();

btnLogin.onclick = async () => {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    toast.error("Login inválido: " + error.message);
    return;
  }

  toast.success("Login realizado! 🔓");
  liberarPainel();
};

function liberarPainel() {
  loginDiv.style.display = "none";
  painelDiv.style.display = "block";
  carregar();
  configurarRealtime();
}

function configurarRealtime() {
  supabase
    .channel("admin-eventos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "eventos" },
      () => {
        carregar();
      }
    )
    .subscribe();
}

function formatarData(data) {
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

async function carregar() {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("dia", { ascending: true });

  if (error) return console.error("Erro ao carregar:", error);

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

const camposData = [document.getElementById("dia"), document.getElementById("data_postagem")];
camposData.forEach(input => {
  input.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5)
      v = v.replace(/(\d{2})(\d{2})(\d+)/, "$1/$2/$3");
    else if (v.length >= 3)
      v = v.replace(/(\d{2})(\d+)/, "$1/$2");
    e.target.value = v;
  });
});

function validarDataBR(data) {
  if (!data) return true; // Opcional pode ser vazio
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
  if (!data) return null;
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
}

btnCriar.onclick = async () => {
  const diaBR = document.getElementById("dia").value;
  const evento = document.getElementById("evento").value;
  const descricao = document.getElementById("descricao").value;
  const postagemBR = document.getElementById("data_postagem").value;

  if (!validarDataBR(diaBR) || !diaBR) return toast.error("Data do evento inválida");
  if (!validarDataBR(postagemBR)) return toast.error("Data de postagem inválida");
  if (!evento) return toast.error("Preencha o nome do evento");

  const dia = brToISO(diaBR);
  const data_postagem = brToISO(postagemBR);

  const { error } = await supabase.from("eventos").insert({ 
    dia, 
    evento, 
    descricao, 
    data_postagem
  });
  
  if (error) {
    toast.error("Erro ao criar evento: " + error.message);
  } else {
    toast.success("Evento criado com sucesso! 📅");
    document.getElementById("dia").value = "";
    document.getElementById("evento").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("data_postagem").value = "";
  }
};

window.remover = async (id) => {
  const ok = await dialog.confirm("Tem certeza que deseja excluir o evento?");
  if (!ok) return;

  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) {
    toast.error("Erro ao remover: " + error.message);
  } else {
    toast.success("Evento excluído!");
  }
};

document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};