// Configurações Base
const PRECO_FIXO_ESPECIAL = 90.0;
const PRECO_TOPPER = 17.0;
const MAX_RECHEIOS = 2; 

// Elementos
const totalEl = document.getElementById("total");
const recheiosEl = document.getElementById("recheios");
const resumoPedidoEl = document.getElementById("resumo-pedido");
const resumoConteudoEl = document.getElementById("resumo-conteudo");

// Estado do Pedido
let pesoDoBolo = 1.0;
let precoBasePorKg = 0;
let recheiosEscolhidos = [];
let topperAtivo = false;
let categoriaAtual = null;

const recheiosDB = {
    classicos: ["Mousse de Limão", "Mousse de Maracujá", "Mousse de Morango"],
    especial1: ["Mousse de Ninho Cremoso", "Mousse de Flocos", "Coco Cremoso", "Brigadeiro Tradicional Branco", "Brigadeiro Tradicional"],
    especial2: ["Mousse de morango com geleia", "Camafeu de nozes","Brigadeiro de Maracujá","Doce de Leite com Nozes", "Doce de Leite com Ameixas", "4 Leites com Morangos","4 Leites com Abacaxi",
        "Creme Belga com Abacaxi","Ninho Trufado","Brigadeiro ovomaltine","Brigadeiro Gourmet","Mousse de Chocolate Branco","Mousse de Chocolate Amargo"],
    premium: ["Ganache de Ninho", "Recheio Sonho de Valsa", "Recheio Raffaello", "Floresta Negra"]
};

// Funções de Cálculo
function calcularTotal() {
    let valorPorKg = 0;
    const isEspecial = document.getElementById("cob-especial").checked;

    if (isEspecial) {
        valorPorKg = PRECO_FIXO_ESPECIAL;
        document.getElementById("opcoes-especiais-container").style.display = "block";
    } else {
        document.getElementById("opcoes-especiais-container").style.display = "none";
        if (recheiosEscolhidos.length > 0) {
            const somaPrecos = recheiosEscolhidos.reduce((acc, r) => acc + r.preco, 0);
            valorPorKg = somaPrecos / recheiosEscolhidos.length;
        } else {
            valorPorKg = precoBasePorKg;
        }
    }

    const totalFinal = (valorPorKg * pesoDoBolo) + (topperAtivo ? PRECO_TOPPER : 0);
    totalEl.innerText = totalFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    gerarResumoVisual();
}

// Gerar Checkboxes de Recheio
function carregarRecheios() {
    recheiosEl.innerHTML = "";
    
    recheiosDB[categoriaAtual].forEach(nome => {
        // REGRA NOVA: Esconde "4 Leites com Morangos" se o bolo for 1kg
        if (nome === "4 Leites com Morangos" && pesoDoBolo === 1.0) {
            return; // Pula a criação deste recheio
        }

        const label = document.createElement("label");
        label.className = "recheio-item-label";
        const checado = recheiosEscolhidos.some(r => r.nome === nome);

        label.innerHTML = `
            <input type="checkbox" ${checado ? 'checked' : ''} data-nome="${nome}" data-preco="${precoBasePorKg}">
            <span>${nome}</span>
        `;

        label.querySelector('input').onchange = function () {
            const limiteNoMomento = (pesoDoBolo === 1.0) ? 1 : MAX_RECHEIOS;

            if (this.checked) {
                if (recheiosEscolhidos.length >= limiteNoMomento) {
                    this.checked = false;
                    const mensagem = (limiteNoMomento === 1) 
                        ? "Para bolos de 1kg, selecione apenas 1 recheio." 
                        : "Você já selecionou o limite de 2 recheios.";
                    alert(mensagem);
                    return;
                }
                recheiosEscolhidos.push({ nome: this.dataset.nome, preco: Number(this.dataset.preco) });
            } else {
                recheiosEscolhidos = recheiosEscolhidos.filter(r => r.nome !== this.dataset.nome);
            }
            calcularTotal();
        };
        recheiosEl.appendChild(label);
    });
}

// Eventos de Seleção de Tamanho
document.querySelectorAll("#tamanhos button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#tamanhos button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pesoDoBolo = Number(btn.dataset.kg);

        let precisouResetar = false;

        // REGRA: Se mudar para 1kg e tiver recheios a mais, limpa a lista
        if (pesoDoBolo === 1.0 && recheiosEscolhidos.length > 1) {
            recheiosEscolhidos = [];
            precisouResetar = true;
            alert("Como você mudou para 1kg, sua seleção de recheios foi reiniciada (limite de 1 recheio).");
        }

        // REGRA: Se mudar para 1kg e tiver "4 Leites com Morangos", remove ele
        if (pesoDoBolo === 1.0 && recheiosEscolhidos.some(r => r.nome === "4 Leites com Morangos")) {
            recheiosEscolhidos = recheiosEscolhidos.filter(r => r.nome !== "4 Leites com Morangos");
            precisouResetar = true;
            alert("O recheio '4 Leites com Morangos' não está disponível para 1kg e foi removido.");
        }

        // Atualiza a lista visual se houver categoria selecionada
        if(categoriaAtual && precisouResetar) carregarRecheios();
        else if (categoriaAtual) carregarRecheios(); // Recarrega para esconder/mostrar o 4 leites

        calcularTotal();
    };
});

document.querySelectorAll("#categorias button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#categorias button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        categoriaAtual = btn.dataset.cat;
        precoBasePorKg = Number(btn.dataset.price);
        carregarRecheios();
        calcularTotal();
    };
});

document.querySelectorAll("#secao-massa button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#secao-massa button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        gerarResumoVisual();
    };
});

document.querySelectorAll("input[name='cobertura'], input[name='sabor-especial']").forEach(input => {
    input.onchange = calcularTotal;
});

document.getElementById("topper-sim").onclick = () => toggleTopper(true);
document.getElementById("topper-nao").onclick = () => toggleTopper(false);
document.getElementById("observacoes").oninput = gerarResumoVisual;
document.getElementById("topper-tema").oninput = gerarResumoVisual;

function toggleTopper(valor) {
    topperAtivo = valor;
    document.getElementById("topper-sim").classList.toggle("active", valor);
    document.getElementById("topper-nao").classList.toggle("active", !valor);
    document.getElementById("topper-input-container").style.display = valor ? "block" : "none";
    calcularTotal();
}

function gerarResumoVisual() {
    if (recheiosEscolhidos.length === 0 && !categoriaAtual) return;
    resumoPedidoEl.style.display = "block";

    const massaAtiva = document.querySelector("#secao-massa button.active");
    const massa = massaAtiva ? massaAtiva.innerText : "Não selecionada";
    
    const recheios = recheiosEscolhidos.map(r => r.nome).join(", ") || "Não selecionado";
    const cobRadio = document.querySelector("input[name='cobertura']:checked");
    let cobTxt = cobRadio.nextElementSibling.innerText;

    if (cobRadio.id === "cob-especial") {
        const sabor = document.querySelector("input[name='sabor-especial']:checked");
        cobTxt = "Especial: " + (sabor ? sabor.value : "---");
    }

    resumoConteudoEl.innerHTML = `
        <div class="resumo-item"><span class="resumo-label">Peso:</span><span class="resumo-valor">${pesoDoBolo}kg</span></div>
        <div class="resumo-item"><span class="resumo-label">Massa:</span><span class="resumo-valor">${massa}</span></div>
        <div class="resumo-item"><span class="resumo-label">Recheio:</span><span class="resumo-valor">${recheios}</span></div>
        <div class="resumo-item"><span class="resumo-label">Cobertura:</span><span class="resumo-valor">${cobTxt}</span></div>
        <div class="resumo-item"><span class="resumo-label">Topper:</span><span class="resumo-valor">${topperAtivo ? 'Sim' : 'Não'}</span></div>
        <div class="resumo-total-final"><span>VALOR TOTAL</span><strong>${totalEl.innerText}</strong></div>
    `;
}

document.querySelector(".finalizar").onclick = function () {
    if (recheiosEscolhidos.length === 0) return alert("Selecione os recheios primeiro!");

    document.getElementById("modal-confirmacao").style.display = "flex";

    setTimeout(() => {
        const massaAtiva = document.querySelector("#secao-massa button.active");
        const massa = massaAtiva ? massaAtiva.innerText : "Branca";
        const recheios = recheiosEscolhidos.map(r => r.nome).join(" e ");
        const cobRadio = document.querySelector("input[name='cobertura']:checked");
        let cobTxt = cobRadio.id === "cob-especial" ? "Especial: " + (document.querySelector("input[name='sabor-especial']:checked")?.value || "") : "Chantininho";

        let msg = `*NOVO PEDIDO - DOCE MUNDO DA MARY*\n\n`;
        msg += `*Bolo de ${pesoDoBolo}kg*\n`;
        msg += `*Massa:* ${massa}\n`;
        msg += `*Recheios:* ${recheios}\n`;
        msg += `*Cobertura:* ${cobTxt}\n`;
        msg += `*Topper:* ${topperAtivo ? 'Sim (' + document.getElementById("topper-tema").value + ')' : 'Não'}\n`;
        msg += `*Obs:* ${document.getElementById("observacoes").value}\n\n`;
        msg += `*VALOR TOTAL:* ${totalEl.innerText}`;

        window.open(`https://wa.me/5518996359278?text=${encodeURIComponent(msg)}`);
        document.getElementById("modal-confirmacao").style.display = "none";
    }, 2000);
};