import { supabase } from "../config/supabase.js";

const LIMITES = {
  Editor: 1,
  Fotografia: 2,
  Storymaker: 1,
  Apoio: 4
};

const app = document.getElementById("app");

function formatarDataBR(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function carregarEventos() {
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .order("dia", { ascending: true });

  const agrupado = {};

  data.forEach(e => {
    if (!agrupado[e.dia]) agrupado[e.dia] = [];
    agrupado[e.dia].push(e.evento);
  });

  render(agrupado);
}

function render(eventos) {
  app.innerHTML = "";

  for (let dia in eventos) {
    const div = document.createElement("div");
    div.className = "day";

    const dataBR = formatarDataBR(dia);
    div.innerHTML = `<h3>${dataBR}</h3>`;

    eventos[dia].forEach(evento => {
      const container = document.createElement("div");

      const titulo = document.createElement("button");
      titulo.innerText = evento;

      const lista = document.createElement("div");
      lista.className = "lista";

      const form = document.createElement("div");
      form.className = "form";

      form.innerHTML = `
        <input type="text" placeholder="Seu nome" class="nome" />
        <select class="funcao">
          <option value="Fotografia">Fotografia 📸</option>
          <option value="Editor">Editor 💻</option>
          <option value="Storymaker">Storymaker 📱</option>
          <option value="Apoio">Apoio 🤝</option>
        </select>
        <button class="confirmar">Confirmar ✔️</button>
      `;

      titulo.onclick = () => form.classList.toggle("show");

      form.querySelector(".confirmar").onclick = async (e) => {
        e.preventDefault();

        const nome = form.querySelector(".nome").value.trim();
        const funcao = form.querySelector(".funcao").value;

        if (!nome) return alert("Digite seu nome");

        const { data } = await supabase
          .from("escala")
          .select("*")
          .eq("dia", dia)
          .eq("evento", evento)
          .eq("funcao", funcao);

        if (data.length >= LIMITES[funcao]) {
          alert(`Limite de ${funcao} atingido`);
          return;
        }

        await supabase.from("escala").insert({
          dia,
          evento,
          nome,
          funcao
        });

        carregar(lista, dia, evento);
        form.classList.remove("show");
        form.querySelector(".nome").value = "";
      };

      container.appendChild(titulo);
      container.appendChild(form);
      container.appendChild(lista);

      carregar(lista, dia, evento);

      div.appendChild(container);
    });

    app.appendChild(div);
  }
}

async function carregar(el, dia, evento) {
  const { data } = await supabase
    .from("escala")
    .select("*")
    .eq("dia", dia)
    .eq("evento", evento);

  el.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      ${item.nome} (${item.funcao})
      <button class="remover">❌</button>
    `;

    div.querySelector(".remover").onclick = async () => {
      if (!confirm("Tem certeza?")) return;

      await supabase.from("escala").delete().eq("id", item.id);
      carregar(el, dia, evento);
    };

    el.appendChild(div);
  });
}

carregarEventos();