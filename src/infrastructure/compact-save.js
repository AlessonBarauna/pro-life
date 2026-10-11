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


const API = { encode, decode, delta, restore, fingerprint };

if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
}

if (typeof globalThis !== "undefined") {
  globalThis.ProLifeCompactSave = API;
}
