import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// ELEMENTOS DA PÁGINA
const area = document.getElementById("cena");
const status = document.getElementById("status");

// CENA
const cena = new THREE.Scene();
cena.background = new THREE.Color(0x83c8f3);
cena.fog = new THREE.Fog(0x83c8f3, 100, 260);

// CÂMERA
const camera = new THREE.PerspectiveCamera(
  65,
  area.clientWidth / area.clientHeight,
  0.1,
  500,
);
camera.position.set(0, 7, 23);
camera.lookAt(0, 1, -12);

// RENDERIZADOR
const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(area.clientWidth, area.clientHeight);
renderizador.outputColorSpace = THREE.SRGBColorSpace;
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
area.appendChild(renderizador.domElement);

// ILUMINAÇÃO
cena.add(new THREE.HemisphereLight(0xe4f4ff, 0x555044, 2));

const luz = new THREE.DirectionalLight(0xffffff, 3);
luz.position.set(-20, 50, 20);
cena.add(luz);

// MATERIAIS
const materialAsfalto = new THREE.MeshStandardMaterial({
  color: 0x55565a,
  roughness: 0.95,
});

const materialCalcada = new THREE.MeshStandardMaterial({
  color: 0xbab8b2,
});

const materialJanela = new THREE.MeshStandardMaterial({
  color: 0x3c708c,
  metalness: 0.3,
  roughness: 0.3,
});

// PISTA INFINITA
const segmentosRua = [];
const objetosDecoracao = [];
const carrosTransito = [];

const TAMANHO_SEGMENTO = 80;
const QUANTIDADE_SEGMENTOS = 7;

for (let i = 0; i < QUANTIDADE_SEGMENTOS; i++) {
  const grupo = new THREE.Group();
  grupo.position.z = 20 - i * TAMANHO_SEGMENTO;

  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(220, TAMANHO_SEGMENTO),
    new THREE.MeshStandardMaterial({ color: 0x777e72 }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.3;
  grupo.add(chao);

  const asfalto = new THREE.Mesh(
    new THREE.PlaneGeometry(24, TAMANHO_SEGMENTO),
    materialAsfalto,
  );
  asfalto.rotation.x = -Math.PI / 2;
  grupo.add(asfalto);

  // Calçadas e meio-fio
  for (const lado of [-1, 1]) {
    const calcada = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.25, TAMANHO_SEGMENTO),
      materialCalcada,
    );
    calcada.position.set(lado * 14, 0.05, 0);
    grupo.add(calcada);

    const meioFio = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, TAMANHO_SEGMENTO),
      new THREE.MeshStandardMaterial({ color: 0xd0cec7 }),
    );
    meioFio.position.set(lado * 12, 0.1, 0);
    grupo.add(meioFio);
  }

  // Faixas amarelas
  for (const x of [-0.18, 0.18]) {
    const faixa = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.025, TAMANHO_SEGMENTO),
      new THREE.MeshBasicMaterial({ color: 0xffd12d }),
    );
    faixa.position.set(x, 0.025, 0);
    grupo.add(faixa);
  }

  // Marcas brancas
  for (let z = -36; z < 40; z += 12) {
    const marca = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.03, 5),
      new THREE.MeshBasicMaterial({ color: 0xe9e9e9 }),
    );
    marca.position.set(5.5, 0.035, z);
    grupo.add(marca);
  }

  // Trilhos
  for (const x of [-3, -2.3, 2.3, 3]) {
    const trilho = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.035, TAMANHO_SEGMENTO),
      new THREE.MeshStandardMaterial({
        color: 0x777a7d,
        metalness: 0.6,
      }),
    );
    trilho.position.set(x, 0.04, 0);
    grupo.add(trilho);
  }

  cena.add(grupo);
  segmentosRua.push(grupo);
}

// PRÉDIOS
function criarPredio(x, z, largura, profundidade, altura, cor, lado) {
  const grupo = new THREE.Group();

  const predio = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, profundidade),
    new THREE.MeshStandardMaterial({ color: cor }),
  );
  predio.position.y = altura / 2;
  grupo.add(predio);

  // Janelas na fachada voltada para a rua
  for (let andar = 1; andar < altura / 2.5; andar++) {
    for (let coluna = 0; coluna < 3; coluna++) {
      const janela = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 1.2, 1.1),
        materialJanela,
      );

      janela.position.set(
        -lado * (largura / 2 + 0.04),
        andar * 2.2,
        -profundidade / 2 + 1.5 + coluna * 2,
      );

      grupo.add(janela);
    }
  }

  grupo.position.set(x, 0, z);
  cena.add(grupo);
  objetosDecoracao.push(grupo);
}

const coresPredios = [
  0x92979b, 0xb9b5ae, 0x656f78, 0xaaa49b, 0x777f87, 0x9c9c98,
];

for (let i = 0; i < 36; i++) {
  const lado = i % 2 === 0 ? -1 : 1;
  const fileira = Math.floor(i / 2);
  const largura = 7 + (fileira % 3) * 2;
  const altura = 25 + (fileira % 5) * 8;

  criarPredio(
    lado * (18 + largura / 2),
    45 - fileira * 10,
    largura,
    10,
    altura,
    coresPredios[i % coresPredios.length],
    lado,
  );
}

// ÁRVORES
function criarArvore(x, z) {
  const grupo = new THREE.Group();

  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.23, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x6f492d }),
  );
  tronco.position.y = 1.25;
  grupo.add(tronco);

  const copa = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x28733b }),
  );
  copa.position.y = 3;
  grupo.add(copa);

  grupo.position.set(x, 0, z);
  cena.add(grupo);
  objetosDecoracao.push(grupo);
}

for (let i = 0; i < 22; i++) {
  const lado = i % 2 === 0 ? -1 : 1;
  criarArvore(lado * 15.5, 40 - Math.floor(i / 2) * 17);
}

// POSTES
function criarPoste(x, z) {
  const grupo = new THREE.Group();

  const poste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.12, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x44484c }),
  );
  poste.position.y = 3;
  grupo.add(poste);

  const lampada = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.15, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xffefc2 }),
  );
  lampada.position.set(-0.3, 5.9, 0);
  grupo.add(lampada);

  grupo.position.set(x, 0, z);
  cena.add(grupo);
  objetosDecoracao.push(grupo);
}

for (let i = 0; i < 16; i++) {
  const lado = i % 2 === 0 ? -1 : 1;
  criarPoste(lado * 11.5, 38 - Math.floor(i / 2) * 22);
}

// CARROS DO TRÂNSITO
function criarCarroTransito(x, z, cor) {
  const grupo = new THREE.Group();

  const carroceria = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.8, 3.8),
    new THREE.MeshStandardMaterial({ color: cor }),
  );
  carroceria.position.y = 0.75;
  grupo.add(carroceria);

  const teto = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x283641 }),
  );
  teto.position.set(0, 1.35, -0.2);
  grupo.add(teto);

  grupo.position.set(x, 0, z);
  cena.add(grupo);
  carrosTransito.push(grupo);
}

for (let i = 0; i < 12; i++) {
  const lado = i % 2 === 0 ? -1 : 1;

  criarCarroTransito(
    lado * 8,
    20 - Math.floor(i / 2) * 22,
    [0xd5d5d5, 0x25292e, 0x9b2929, 0x304c67][i % 4],
  );
}

// JOGADORES
const jogadores = [
  {
    id: 1,
    cor: 0xff2020,
    x: -4,
    z: 10,
    velocidade: 0,
    distancia: 0,
    modelo: null,
    teclas: {
      acelerar: "w",
      frear: "s",
      esquerda: "a",
      direita: "d",
    },
  },
  {
    id: 2,
    cor: 0x1688ff,
    x: 4,
    z: 10,
    velocidade: 0,
    distancia: 0,
    modelo: null,
    teclas: {
      acelerar: "arrowup",
      frear: "arrowdown",
      esquerda: "arrowleft",
      direita: "arrowright",
    },
  },
];

const teclasPressionadas = {};
let corridaAtiva = false;
let pausado = false;
let vencedor = null;
let ultimoTempo = 0;
let tempoCorrida = 0;

const distanciaFinal = 1000;
const LARGURA_MINIMA_CARROS = 3.5;
const DISTANCIA_MINIMA_Z = 5.2;

// CARREGAMENTO DAS FERRARIS
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/",
);

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

status.textContent = "Carregando as Ferraris...";

loader.load(
  "https://threejs.org/examples/models/gltf/ferrari.glb",
  (gltf) => {
    jogadores.forEach((jogador) => {
      const carro = gltf.scene.clone(true);

      carro.traverse((objeto) => {
        if (!objeto.isMesh) return;

        objeto.material = Array.isArray(objeto.material)
          ? objeto.material.map((m) => m.clone())
          : objeto.material.clone();

        const materiais = Array.isArray(objeto.material)
          ? objeto.material
          : [objeto.material];

        if (objeto.name.toLowerCase().includes("body")) {
          materiais.forEach((material) => {
            if (material.color) material.color.setHex(jogador.cor);
          });
        }
      });

      carro.scale.setScalar(1.15);
      carro.rotation.y = 0;
      carro.position.set(jogador.x, 0.12, jogador.z);

      jogador.modelo = carro;
      cena.add(carro);
    });

    status.textContent = "Ferraris carregadas! Clique em COMEÇAR CORRIDA.";
  },
  undefined,
  (erro) => {
    console.error("Erro ao carregar a Ferrari:", erro);
    status.textContent = "Erro ao carregar a Ferrari. Confira a internet.";
  },
);

// INICIAR CORRIDA
document.getElementById("iniciar").addEventListener("click", () => {
  if (!jogadores.every((j) => j.modelo)) {
    status.textContent = "Espere as Ferraris carregarem.";
    return;
  }

  if (vencedor !== null) reiniciarCorrida();

  corridaAtiva = true;
  pausado = false;
  document.getElementById("telaInicial").classList.add("escondida");
  status.textContent = "VALENDO! Cada jogador controla seu carro!";
});

// PAUSAR
document.getElementById("pausar").addEventListener("click", () => {
  if (vencedor !== null) return;

  pausado = !pausado;
  document.getElementById("pausar").textContent = pausado ? "▶" : "Ⅱ";
  status.textContent = pausado ? "Jogo pausado" : "Corrida em andamento!";
});

// REINICIAR
document
  .getElementById("reiniciar")
  .addEventListener("click", reiniciarCorrida);

function reiniciarCorrida() {
  corridaAtiva = false;
  pausado = false;
  vencedor = null;
  tempoCorrida = 0;

  jogadores.forEach((jogador, indice) => {
    jogador.x = indice === 0 ? -4 : 4;
    jogador.z = 10;
    jogador.velocidade = 0;
    jogador.distancia = 0;

    if (jogador.modelo) {
      jogador.modelo.position.set(jogador.x, 0.12, jogador.z);
    }
  });

  segmentosRua.forEach((grupo, i) => {
    grupo.position.z = 20 - i * TAMANHO_SEGMENTO;
  });

  document.getElementById("telaInicial").classList.remove("escondida");
  document.getElementById("iniciar").textContent = "COMEÇAR CORRIDA";
  document.getElementById("pausar").textContent = "Ⅱ";
  document.getElementById("mensagemRodape").textContent =
    "Prepare-se para correr!";
  status.textContent = "Corrida reiniciada!";
}

// TECLADO
window.addEventListener("keydown", (evento) => {
  const tecla = evento.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(tecla)
  ) {
    evento.preventDefault();
  }

  teclasPressionadas[tecla] = true;
});

window.addEventListener("keyup", (evento) => {
  teclasPressionadas[evento.key.toLowerCase()] = false;
});

// CONTROLES NA TELA PARA O JOGADOR 1

// CONTROLES NA TELA PARA OS DOIS JOGADORES
document.querySelectorAll("[data-tecla]").forEach((botao) => {

    const tecla = botao.dataset.tecla;
    const toques = new Set();

    // Pressionar o botão
    botao.addEventListener("pointerdown", (evento) => {
        evento.preventDefault();

        toques.add(evento.pointerId);
        teclasPressionadas[tecla] = true;

        botao.setPointerCapture(evento.pointerId);
    });

    // Soltar o botão
    function soltar(evento) {
        toques.delete(evento.pointerId);

        if (toques.size === 0) {
            teclasPressionadas[tecla] = false;
        }
    }

    botao.addEventListener("pointerup", soltar);
    botao.addEventListener("pointercancel", soltar);
    botao.addEventListener("lostpointercapture", soltar);
});

// Evita teclas presas quando o jogo perde o foco
window.addEventListener("blur", () => {
    Object.keys(teclasPressionadas).forEach((tecla) => {
        teclasPressionadas[tecla] = false;
    });
});

// MOVIMENTO INDEPENDENTE
function atualizarJogador(jogador, delta) {
  if (!corridaAtiva || pausado || !jogador.modelo) return;

  const teclas = jogador.teclas;

  if (teclasPressionadas[teclas.acelerar]) {
    jogador.velocidade += 38 * delta;
  } else {
    jogador.velocidade -= 8 * delta;
  }

  if (teclasPressionadas[teclas.frear]) {
    jogador.velocidade -= 55 * delta;
  }

  jogador.velocidade = THREE.MathUtils.clamp(jogador.velocidade, 0, 180);

  if (teclasPressionadas[teclas.esquerda]) {
    jogador.x -= 7 * delta;
  }

  if (teclasPressionadas[teclas.direita]) {
    jogador.x += 7 * delta;
  }

  jogador.x = THREE.MathUtils.clamp(jogador.x, -9, 9);

  // A distância de cada jogador é independente
  jogador.distancia += (jogador.velocidade / 3.6) * delta;
}

// POSICIONA OS CARROS COM BASE NA DISTÂNCIA RELATIVA
function posicionarCarros() {
  const mediaDistancia = (jogadores[0].distancia + jogadores[1].distancia) / 2;

  jogadores.forEach((jogador) => {
    if (!jogador.modelo) return;

    // O líder aparece mais à frente; o outro fica atrás
    const diferencaDistancia = jogador.distancia - mediaDistancia;

    jogador.z = 10 - diferencaDistancia * 0.15;

    jogador.modelo.position.x = jogador.x;
    jogador.modelo.position.z = jogador.z;
  });
}

// COLISÃO REAL SIMPLIFICADA
function verificarColisao() {
  const j1 = jogadores[0];
  const j2 = jogadores[1];

  if (!j1.modelo || !j2.modelo) return;

  const diferencaX = j1.x - j2.x;
  const diferencaZ = j1.z - j2.z;

  // Só ocorre colisão se estiverem próximos na horizontal e na profundidade
  if (
    Math.abs(diferencaX) < LARGURA_MINIMA_CARROS &&
    Math.abs(diferencaZ) < DISTANCIA_MINIMA_Z
  ) {
    // Reduz a velocidade dos dois carros
    j1.velocidade *= 0.55;
    j2.velocidade *= 0.55;

    // Afasta os carros para lados opostos
    if (diferencaX === 0) {
      j1.x = -LARGURA_MINIMA_CARROS / 2;
      j2.x = LARGURA_MINIMA_CARROS / 2;
    } else {
      const lado = diferencaX > 0 ? 1 : -1;
      const meio = (j1.x + j2.x) / 2;

      j1.x = meio + lado * (LARGURA_MINIMA_CARROS / 2);
      j2.x = meio - lado * (LARGURA_MINIMA_CARROS / 2);
    }

    // Mantém os carros dentro dos limites da pista
    j1.x = THREE.MathUtils.clamp(j1.x, -9, 9);
    j2.x = THREE.MathUtils.clamp(j2.x, -9, 9);

    // Atualiza imediatamente a posição dos modelos
    j1.modelo.position.x = j1.x;
    j2.modelo.position.x = j2.x;

    status.textContent = "💥 BATIDA! Os carros perderam velocidade!";
  }
}

// REPETE A PISTA
function moverCenario(delta) {
  if (!corridaAtiva || pausado) return;

  // A rua acompanha a velocidade média dos dois
  const velocidadeMedia =
    (jogadores[0].velocidade + jogadores[1].velocidade) / 2 / 3.6;

  segmentosRua.forEach((grupo) => {
    grupo.position.z += velocidadeMedia * delta;

    if (grupo.position.z > 20 + TAMANHO_SEGMENTO) {
      const maisDistante = Math.min(
        ...segmentosRua.map((segmento) => segmento.position.z),
      );

      grupo.position.z = maisDistante - TAMANHO_SEGMENTO;
    }
  });

  objetosDecoracao.forEach((objeto) => {
    objeto.position.z += velocidadeMedia * delta;

    if (objeto.position.z > 35) {
      objeto.position.z -= 360;
    }
  });

  carrosTransito.forEach((carro) => {
    carro.position.z += velocidadeMedia * delta;

    if (carro.position.z > 30) {
      carro.position.z -= 300;
    }
  });
}

// PAINEL
function atualizarPainel() {
  const j1 = jogadores[0];
  const j2 = jogadores[1];

  document.getElementById("velocidade1").textContent = Math.round(
    j1.velocidade,
  );

  document.getElementById("distancia1").textContent =
    `${Math.round(j1.distancia)} m`;

  document.getElementById("distancia2").textContent =
    `${Math.round(j2.distancia)} m`;

  document.getElementById("progresso").textContent =
    `${Math.min(100, Math.round((j1.distancia / distanciaFinal) * 100))}%`;

  document.getElementById("marcha").textContent = Math.min(
    6,
    Math.floor(j1.velocidade / 30) + 1,
  );

  const minutos = Math.floor(tempoCorrida / 60);
  const segundos = Math.floor(tempoCorrida % 60);

  document.getElementById("tempo").textContent =
    `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

// ANIMAÇÃO
function animar(tempo) {
  requestAnimationFrame(animar);

  const delta =
    ultimoTempo === 0 ? 0 : Math.min((tempo - ultimoTempo) / 1000, 0.05);

  ultimoTempo = tempo;

  if (corridaAtiva && !pausado) {
    tempoCorrida += delta;

    // Primeiro atualiza a velocidade e a distância dos dois
    jogadores.forEach((jogador) => atualizarJogador(jogador, delta));

    // Depois posiciona os carros e verifica colisões
    posicionarCarros();
    verificarColisao();

    // Atualiza a posição depois da colisão
    posicionarCarros();

    moverCenario(delta);

    // Verifica quem terminou a corrida
    jogadores.forEach((jogador) => {
      if (jogador.distancia >= distanciaFinal && vencedor === null) {
        jogador.distancia = distanciaFinal;
        vencedor = jogador.id;
        corridaAtiva = false;

        status.textContent = `🏆 JOGADOR ${jogador.id} VENCEU!`;
        document.getElementById("mensagemRodape").textContent =
          `Vitória do Jogador ${jogador.id}!`;

        document.getElementById("telaInicial").classList.remove("escondida");
        document.getElementById("iniciar").textContent = "JOGAR NOVAMENTE";
      }
    });
  }

  atualizarPainel();

  // Câmera acompanha a região entre os carros
  const zMedio = (jogadores[0].z + jogadores[1].z) / 2;

  camera.position.z += (zMedio + 13 - camera.position.z) * 0.05;
  camera.lookAt(0, 1, zMedio - 20);

  renderizador.render(cena, camera);
}

requestAnimationFrame(animar);

// REDIMENSIONAMENTO
window.addEventListener("resize", () => {
  camera.aspect = area.clientWidth / area.clientHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(area.clientWidth, area.clientHeight);
});