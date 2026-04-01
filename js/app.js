import { supabase } from "../config/supabase.js";

const eventos = {
  Terça: ["Missa 19h", "Ofício das trevas 20h"],
  Quarta: ["Missa 19h"],
  Quinta: ["Ceia do Senhor 20h", "Adoração eucarística 23:45"],
  Sexta: ["Celebração da paixão 15h", "Procissão e encenação 17h"],
  Sábado: ["Vigília pascal 20h"],
  Domingo: ["Missa 11h"]
};

const LIMITES = {
  Editor: 1,
  Fotografia: 2,
  Storymaker: 1,
  Apoio: 4
};

const app = document.getElementById("app");


const listas = [];

function registrarLista(el, dia, evento) {
  listas.push({ el, dia, evento });
}

async function atualizarTudo() {
  for (let item of listas) {
    await carregar(item.el, item.dia, item.evento);
  }
}


for (let dia in eventos) {
  const div = document.createElement("div");
  div.className = "day";

  div.innerHTML = `<h3>${dia}</h3>`;

  eventos[dia].forEach(evento => {
    const container = document.createElement("div");

    const titulo = document.createElement("button");
    titulo.innerText = evento;

    const lista = document.createElement("div");
    lista.className = "lista";

    registrarLista(lista, dia, evento);

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

    titulo.onclick = () => {
      form.classList.toggle("show");
    };

    form.querySelector(".confirmar").onclick = async (e) => {
      e.preventDefault();

      const nomeInput = form.querySelector(".nome");
      const funcaoSelect = form.querySelector(".funcao");

      const nome = nomeInput.value.trim();
      const funcao = funcaoSelect.value;

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

      const jaExiste = data.find(d => d.nome === nome);
      if (jaExiste) {
        alert("Você já está inscrito nesse evento");
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

      nomeInput.value = "";
      funcaoSelect.selectedIndex = 0;
    };

    container.appendChild(titulo);
    container.appendChild(form);
    container.appendChild(lista);

    carregar(lista, dia, evento);

    div.appendChild(container);
  });

  app.appendChild(div);
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
      const ok = confirm("Tem certeza que deseja sair deste evento?");
      if (!ok) return;

      await supabase
        .from("escala")
        .delete()
        .eq("id", item.id);

      carregar(el, dia, evento);
    };

    el.appendChild(div);
  });
}


let timeout;

function atualizarComDelay() {
  clearTimeout(timeout);
  timeout = setTimeout(atualizarTudo, 200);
}

supabase
  .channel("realtime-escala")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "escala"
    },
    () => {
      atualizarComDelay();
    }
  )
  .subscribe();