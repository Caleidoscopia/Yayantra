export const NUM_SLOTS = 5;

const slots = new Array(NUM_SLOTS).fill(null); // cada slot guarda un id de personaje o null

export function obtenerSlots() {
  return [...slots];
}

// Coloca un personaje en un slot. Devuelve qué hay que activar y qué desactivar.
export function colocar(indice, id) {
  const previo = slots.indexOf(id);
  if (previo === indice) return { activar: null, desactivar: [] }; // ya estaba ahí

  if (previo !== -1) slots[previo] = null; // se movió desde otro slot

  const desactivar = slots[indice] ? [slots[indice]] : []; // el que estaba, sale
  slots[indice] = id;
  return { activar: id, desactivar };
}

export function quitar(indice) {
  const id = slots[indice];
  slots[indice] = null;
  return { activar: null, desactivar: id ? [id] : [] };
}