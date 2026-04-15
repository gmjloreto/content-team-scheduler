import { supabase } from "../config/supabase.js";

const LIMITES = {
  Editor: 1,
  Fotografia: 2,
  Storymaker: 1,
  "Arte/Design": 1,
  Apoio: 4
};

const app = document.getElementById("app");

function formatarDataBR(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function configurarRealtime() {
  const channel = supabase.channel("escala-global");

  channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "escala" },
      (payload) => {
        const item = payload.eventType === "DELETE" ? payload.old : payload.new;
        
        // Se for DELETE, tentamos animar antes de sumir
        if (payload.eventType === "DELETE" && item.id) {
          const el = document.querySelector(`.item[data-id="${item.id}"]`);
          if (el) {
            el.classList.add("removing");
            setTimeout(() => {
              const container = el.closest(".event-container");
              if (container) carregarEscalaNoEvento(container, container.dataset.dia, container.dataset.evento);
            }, 300);
            return;
          }
        }

        if (item.dia && item.evento) {
          const container = document.querySelector(`.event-container[data-dia="${item.dia}"][data-evento="${item.evento}"]`);
          if (container) carregarEscalaNoEvento(container, item.dia, item.evento);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "eventos" },
      () => carregarEventos()
    )
    .subscribe();
}

async function carregarEventos() {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("dia", { ascending: true });

  if (error) return;

  render(data);
}

function render(eventos) {
  app.innerHTML = "";

  const agrupado = {};
  eventos.forEach(e => {
    if (!agrupado[e.dia]) agrupado[e.dia] = [];
    agrupado[e.dia].push(e);
  });

  for (let dia in agrupado) {
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `<h3>${formatarDataBR(dia)}</h3>`;

    agrupado[dia].forEach(ev => {
      const container = document.createElement("div");
      container.className = "event-container";
      container.dataset.dia = ev.dia;
      container.dataset.evento = ev.evento;

      const titulo = document.createElement("button");
      titulo.innerHTML = `<strong>${ev.evento}</strong>`;

      const briefingDiv = document.createElement("div");
      briefingDiv.className = "briefing";
      if (!ev.descricao && !ev.data_postagem) briefingDiv.style.display = "none";

      briefingDiv.innerHTML = `
        ${ev.descricao ? `<p>📝 ${ev.descricao}</p>` : ""}
        ${ev.data_postagem ? `<div class="briefing-meta"><span>📅 Postar em: ${formatarDataBR(ev.data_postagem)}</span></div>` : ""}
        <div class="briefing-responsavel"></div>
      `;

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
          <option value="Arte/Design">Arte/Design 🎨</option>
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

        const { data: atuais } = await supabase.from("escala").select("*").eq("dia", ev.dia).eq("evento", ev.evento).eq("funcao", funcao);
        if (atuais && atuais.length >= LIMITES[funcao]) return alert(`Limite de ${funcao} atingido!`);

        const { error } = await supabase.from("escala").insert({ dia: ev.dia, evento: ev.evento, nome, funcao });
        if (!error) {
          carregarEscalaNoEvento(container, ev.dia, ev.evento);
          form.classList.remove("show");
          form.querySelector(".nome").value = "";
        }
      };

      container.appendChild(titulo);
      container.appendChild(briefingDiv);
      container.appendChild(form);
      container.appendChild(lista);
      
      carregarEscalaNoEvento(container, ev.dia, ev.evento);
      div.appendChild(container);
    });
    app.appendChild(div);
  }
}

async function carregarEscalaNoEvento(container, dia, evento) {
  const { data, error } = await supabase.from("escala").select("*").eq("dia", dia).eq("evento", evento);
  if (error) return;

  const listaEl = container.querySelector(".lista");
  const briefingDiv = container.querySelector(".briefing");
  const respEl = container.querySelector(".briefing-responsavel");

  listaEl.innerHTML = "";
  respEl.innerHTML = "";

  let temArte = false;
  const icones = {
    "Fotografia": "📸",
    "Editor": "💻",
    "Storymaker": "📱",
    "Apoio": "🤝",
    "Arte/Design": "🎨"
  };

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.id = item.id;

    const icone = icones[item.funcao] || "";
    const tagClass = `tag-${item.funcao.toLowerCase().replace("/", "").replace(" ", "")}`;

    if (item.funcao === "Arte/Design") {
      div.classList.add("resp-arte");
      div.innerHTML = `
        <span>👤 <strong>Resp. Arte:</strong> ${item.nome}</span>
        <button class="remover">❌</button>
      `;
      div.querySelector(".remover").onclick = async () => {
        if (!confirm("Remover responsável pela arte?")) return;
        div.classList.add("removing");
        setTimeout(async () => {
          await supabase.from("escala").delete().eq("id", item.id);
          carregarEscalaNoEvento(container, dia, evento);
        }, 300);
      };
      respEl.appendChild(div);
      temArte = true;
    } else {
      div.innerHTML = `
        <span>
          <strong>${item.nome}</strong> 
          <span class="tag-funcao ${tagClass}">${icone} ${item.funcao}</span>
        </span>
        <button class="remover">❌</button>
      `;
      div.querySelector(".remover").onclick = async () => {
        if (!confirm("Remover sua inscrição?")) return;
        div.classList.add("removing");
        setTimeout(async () => {
          await supabase.from("escala").delete().eq("id", item.id);
          carregarEscalaNoEvento(container, dia, evento);
        }, 300);
      };
      listaEl.appendChild(div);
    }
  });

  const temBriefingOriginal = briefingDiv.querySelector("p") || briefingDiv.querySelector(".briefing-meta");
  if (temArte || temBriefingOriginal) {
    briefingDiv.style.display = "block";
  } else {
    briefingDiv.style.display = "none";
  }
}

carregarEventos();
configurarRealtime();