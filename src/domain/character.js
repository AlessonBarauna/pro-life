(function (root) {
  "use strict";
  const hair = [
    ["crew", "Corte social curto"],
    ["lowfade", "Degradê baixo"],
    ["highfade", "Degradê alto"],
    ["buzz", "Raspado / buzz cut"],
    ["curly", "Cachos com degradê"],
    ["afro", "Black power"],
    ["twists", "Twists"],
    ["braids", "Tranças"],
    ["mullet", "Mullet"],
    ["long", "Longo preso"],
    ["bald", "Sem cabelo"],
  ];
  const beard = [
    ["none", "Sem barba"],
    ["stubble", "Barba por fazer"],
    ["short", "Barba curta"],
    ["full", "Barba cheia"],
    ["mustache", "Bigode"],
    ["goatee", "Cavanhaque"],
  ];
  const body = [
    ["slim", "Magro"],
    ["normal", "Atlético"],
    ["strong", "Forte"],
  ];
  const accessory = [
    ["none", "Nenhum"],
    ["glasses", "Óculos"],
    ["mask", "Máscara facial de proteção"],
  ];
  const tattoo = [
    ["none", "Sem tatuagem"],
    ["left", "Braço esquerdo"],
    ["right", "Braço direito"],
    ["both", "Dois braços"],
  ];
  const celebrations = [
    "Braços abertos",
    "Punho erguido",
    "Ajoelhado",
    "Discreto",
    "Apontar para o céu",
    "Coração com as mãos",
    "Deslizar de joelhos",
    "Beijar o escudo",
    "Braços cruzados",
    "Mãos nos ouvidos",
    "Salto e giro",
    "Dança curta",
    "Abraçar os companheiros",
    "Agradecer à torcida",
    "Salto com punho",
    "Gesto de silêncio",
  ];
  const hex = (value, fallback) => (/^#[a-f0-9]{6}$/i.test(value || "") ? value : fallback);
  function normalize(a = {}) {
    if (!a || typeof a !== "object") a = {};
    const aliases = {
      hair: { short: "crew" },
      beard: { no: "none", yes: "full" },
      tattoo: { no: "none", yes: "both" },
    };
    const choose = (key, list, fallback) => {
      let value = aliases[key]?.[a[key]] || a[key];
      return list.some((v) => v[0] === value) ? value : fallback;
    };
    return {
      skin: hex(a.skin, "#bc8660"),
      hairColor: hex(a.hairColor, "#241e1a"),
      eyeColor: hex(a.eyeColor, "#694829"),
      hair: choose("hair", hair, "lowfade"),
      beard: choose("beard", beard, "none"),
      body: choose("body", body, "normal"),
      accessory: choose("accessory", accessory, "none"),
      tattoo: choose("tattoo", tattoo, "none"),
    };
  }
  function kit(club) {
    return {
      primary: hex(club?.color, "#d8dee1"),
      secondary: club ? "#18222c" : "#455363",
      name: club?.name || "EQUIPE DE TREINO",
    };
  }
  const api = { hair, beard, body, accessory, tattoo, celebrations, normalize, kit };
  root.ProLifeCharacter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
