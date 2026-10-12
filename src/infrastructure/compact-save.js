"use strict";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delta(base, current) {
  const original = new Map(base.map(x => [x.id, x]));
  const currentIds = new Set();
  const changes = [];
  const removed = [];
  const order = [];

  for (const item of current) {
    if (!item || !item.id || currentIds.has(item.id)) {
      throw Error("Registro invalido ou ID duplicado.");
    }

    currentIds.add(item.id);
    order.push(item.id);

    const before = original.get(item.id);

    if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
      changes.push(item);
    }
  }

  for (const item of base) {
    if (!currentIds.has(item.id)) removed.push(item.id);
  }

  return { changes, removed, order };
}

function restore(base, patch) {
  const records = new Map(base.map(x => [x.id, clone(x)]));

  for (const id of patch.removed) records.delete(id);
  for (const item of patch.changes) records.set(item.id, clone(item));

  const result = patch.order.map(id => {
    if (!records.has(id)) throw Error("Registro ausente: " + id);
    return records.get(id);
  });

  if (new Set(patch.order).size !== patch.order.length) {
    throw Error("IDs duplicados no save.");
  }

  return result;
}


// 34F.17: caminho rapido do autosave. O JSON de cada registro-base e calculado uma unica vez por base (a base e imutavel);
// o delta e a verificacao reutilizam essas strings em vez de reserializar ~17,8 mil registros a cada gravacao.
// A saida de deltaFast e identica a de delta().
function prepareBase(base) {
  const json = new Map();
  for (const x of base) json.set(x.id, JSON.stringify(x));
  return { json };
}

function deltaFast(prepared, base, current) {
  const currentIds = new Set();
  const changes = [];
  const removed = [];
  const order = [];
  const currentJson = new Array(current.length);
  let n = 0;

  for (const item of current) {
    if (!item || !item.id || currentIds.has(item.id)) {
      throw Error("Registro invalido ou ID duplicado.");
    }

    currentIds.add(item.id);
    order.push(item.id);

    const text = JSON.stringify(item);
    currentJson[n++] = text;

    if (prepared.json.get(item.id) !== text) changes.push(item);
  }

  for (const item of base) {
    if (!currentIds.has(item.id)) removed.push(item.id);
  }

  return { patch: { changes, removed, order }, currentJson };
}

// Verifica o envelope sem clonar a base: reconstroi o JSON do resultado de restore() a partir do patch (ordem, removidos e
// alterados via ida e volta pelo JSON) e compara com o JSON do estado atual. Registros inalterados vem do JSON-base, igual ao
// que restore() devolveria.
function verifyFast(prepared, patch, currentJson) {
  const changed = new Map();
  for (const item of patch.changes) changed.set(item.id, JSON.stringify(JSON.parse(JSON.stringify(item))));
  const removed = new Set(patch.removed);
  if (new Set(patch.order).size !== patch.order.length) return false;
  if (patch.order.length !== currentJson.length) return false;
  for (let i = 0; i < patch.order.length; i++) {
    const id = patch.order[i];
    let text = changed.get(id);
    if (text === undefined) {
      if (removed.has(id)) return false;
      text = prepared.json.get(id);
    }
    if (text === undefined || text !== currentJson[i]) return false;
  }
  return true;
}

// Mesmo resultado de restore(), mas clona a partir do JSON-base ja calculado (JSON.parse) em vez de reserializar cada registro.
function restoreFast(prepared, patch) {
  const removed = new Set(patch.removed);
  const changed = new Map();
  for (const item of patch.changes) changed.set(item.id, item);
  if (new Set(patch.order).size !== patch.order.length) throw Error("IDs duplicados no save.");
  return patch.order.map(id => {
    if (changed.has(id)) return clone(changed.get(id));
    const text = removed.has(id) ? undefined : prepared.json.get(id);
    if (text === undefined) throw Error("Registro ausente: " + id);
    return JSON.parse(text);
  });
}

function fingerprint(value) {
  const json = JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function encode(base, current) {
  return {
    format: "PRO_LIFE_COMPACT_EXPERIMENTAL",
    version: 2,
    baseFingerprint: {
      internationalPlayers: fingerprint(base.internationalPlayers),
      clubs: fingerprint(base.clubs)
    },
    internationalPlayers: delta(
      base.internationalPlayers,
      current.internationalPlayers
    ),
    clubs: delta(base.clubs, current.clubs)
  };
}

function decode(base, compact) {
  if (
    compact?.format !== "PRO_LIFE_COMPACT_EXPERIMENTAL" ||
    compact.version !== 2
  ) {
    throw Error("Formato de save compacto incompat?vel.");
  }

  if (
    compact.baseFingerprint?.internationalPlayers !==
      fingerprint(base.internationalPlayers) ||
    compact.baseFingerprint?.clubs !== fingerprint(base.clubs)
  ) {
    throw Error("Cat?logo-base incompat?vel. Save preservado.");
  }

  return {
    internationalPlayers: restore(
      base.internationalPlayers,
      compact.internationalPlayers
    ),
    clubs: restore(base.clubs, compact.clubs)
  };
}


const API = { encode, decode, delta, restore, fingerprint, prepareBase, deltaFast, verifyFast, restoreFast };

if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
}

if (typeof globalThis !== "undefined") {
  globalThis.ProLifeCompactSave = API;
}
