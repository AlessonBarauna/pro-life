(function (root) {
  "use strict";
  function encode(value) { return JSON.stringify(value); }
  function decode(text) { return JSON.parse(String(text)); }
  root.ProLifeCodec = { encode, decode, format: "json-v1" };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeCodec;
})(typeof globalThis !== "undefined" ? globalThis : this);
