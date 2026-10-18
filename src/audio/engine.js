import * as Tone from 'tone';

const BPM = 95;
const FADE_IN = 0.05; // segundos que tarda un personaje en llegar a volumen completo
const pistas = new Map(); // id -> { player, entrada, mezcla, estado, token, muteada }
let duracionLoop = 0;
let relojIniciado = false; // el reloj arranca con el primer personaje
let soloId = null; // id del personaje en solo, o null
const maestro = new Tone.Gain(1).toDestination(); // volumen general del juego

// estado: 'inactiva' | 'pendiente' (espera el próximo loop) | 'activa'
// entrada: 0/1, controla cuándo entra o sale del loop
// mezcla: mute y solo, cambia al instante

export async function cargarPistas(lista) {
  Tone.Transport.bpm.value = BPM;

  for (const item of lista) {
    const mezcla = new Tone.Gain(1).connect(maestro);
    const entrada = new Tone.Gain(0).connect(mezcla);
    const player = new Tone.Player({ url: item.archivo, loop: true, fadeOut: 0.05 }).connect(entrada);
    pistas.set(item.id, { player, entrada, mezcla, estado: 'inactiva', token: 0, muteada: false });
  }

  await Tone.loaded();

  // La duración real del archivo marca cada cuánto reinicia el loop
  duracionLoop = pistas.values().next().value.player.buffer.duration;

  for (const [id, { player }] of pistas) {
    if (Math.abs(player.buffer.duration - duracionLoop) > 0.01) {
      console.warn(`El loop "${id}" dura distinto a los demás, se va a desfasar.`);
    }
    player.sync().start(0);
  }
}

export async function iniciar() {
  await Tone.start();
}

// Progreso del loop actual, de 0 a 1 (para el reloj)
export function progresoLoop() {
  if (!duracionLoop || !relojIniciado) return 0;
  return (Tone.Transport.seconds % duracionLoop) / duracionLoop;
}

export function estadoPista(id) {
  return pistas.get(id).estado;
}

// ---------- Mute y solo ----------

function volumenMezcla(id) {
  if (soloId !== null) return id === soloId ? 1 : 0;
  return pistas.get(id).muteada ? 0 : 1;
}

function actualizarMezcla() {
  for (const [id, pista] of pistas) {
    pista.mezcla.gain.rampTo(volumenMezcla(id), 0.03);
  }
}

export function alternarMute(id) {
  const pista = pistas.get(id);
  pista.muteada = !pista.muteada;
  actualizarMezcla();
}

export function alternarSolo(id) {
  soloId = soloId === id ? null : id;
  actualizarMezcla();
}

// Para dibujar los botones: muteada y solo son el estado de cada botón,
// silenciada es si realmente se está escuchando o no
export function infoMezcla(id) {
  return {
    muteada: pistas.get(id).muteada,
    solo: soloId === id,
    silenciada: volumenMezcla(id) === 0,
  };
}

// ---------- Entrada y salida de personajes ----------

// Momento exacto (en tiempo de audio) en que empieza el próximo loop
function proximoInicioLoop() {
  const faltan = duracionLoop - (Tone.Transport.seconds % duracionLoop);
  return Tone.now() + faltan;
}

export function activar(id, alEntrar) {
  const pista = pistas.get(id);
  if (pista.estado !== 'inactiva') return; // ya suena o ya está esperando

  pista.estado = 'pendiente';
  pista.muteada = false;
  actualizarMezcla();
  const token = ++pista.token;

  let momento;
  if (!relojIniciado) {
    // Primer personaje: arranca el reloj y suena de inmediato
    momento = Tone.now();
    Tone.Transport.start(momento);
    relojIniciado = true;
  } else {
    // Los siguientes entran en el próximo reinicio del loop
    momento = proximoInicioLoop();
  }

  pista.entrada.gain.setValueAtTime(0, momento);
  pista.entrada.gain.linearRampToValueAtTime(1, momento + FADE_IN);

  Tone.Draw.schedule(() => {
    if (pista.token !== token) return; // se canceló antes de entrar
    pista.estado = 'activa';
    alEntrar?.(id);
  }, momento);
}

// Se silencia de inmediato y cancela cualquier entrada pendiente
export function desactivar(id) {
  const pista = pistas.get(id);
  pista.token++;
  pista.estado = 'inactiva';
  pista.entrada.gain.cancelScheduledValues(Tone.now());
  pista.entrada.gain.rampTo(0, 0.05);

  if (soloId === id) soloId = null; // si estaba en solo, los demás vuelven a oírse
  actualizarMezcla();
}

function hayPersonajes() {
  for (const pista of pistas.values()) {
    if (pista.estado !== 'inactiva') return true; // suena o está esperando
  }
  return false;
}

// Si no quedó ningún personaje, detiene todo y deja el reloj en cero
export function detenerSiVacio() {
  if (!relojIniciado || hayPersonajes()) return;
  Tone.Transport.stop();
  relojIniciado = false;
}

// valor: de 0 a 1 (lo que marca la barra)
export function fijarVolumen(valor) {
  // Se eleva al cuadrado porque el oído percibe el volumen de forma no lineal:
  // así la barra se siente pareja en todo su recorrido
  maestro.gain.rampTo(valor * valor, 0.05);
}