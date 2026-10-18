import './style.css';
import { personajes } from './game/characters.js';
import {
  cargarPistas, iniciar, activar, desactivar, estadoPista, progresoLoop, detenerSiVacio,
  alternarMute, alternarSolo, infoMezcla, fijarVolumen,
} from './audio/engine.js';
import { NUM_SLOTS, obtenerSlots, colocar, quitar } from './game/state.js';

const btnStart = document.querySelector('#start');
const juego = document.querySelector('#juego');
const barra = document.querySelector('#barra');
const contenedorSlots = document.querySelector('#slots');
const reloj = document.querySelector('#reloj');
const sliderVolumen = document.querySelector('#volumen');
const iconoVolumen = document.querySelector('#volumen-icono');
const inicio = document.querySelector('#inicio');
const estado = document.querySelector('#estado');

const porId = new Map(personajes.map((p) => [p.id, p]));

let slotsAnteriores = new Array(NUM_SLOTS).fill(null); // para animar solo lo que cambia

for (let i = 0; i < NUM_SLOTS; i++) {
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.dataset.indice = i;
  contenedorSlots.appendChild(slot);
}

function actualizarVolumen() {
  const valor = Number(sliderVolumen.value) / 100;
  fijarVolumen(valor);
  iconoVolumen.textContent = valor === 0 ? '🔇' : valor < 0.5 ? '🔉' : '🔊';
}

sliderVolumen.addEventListener('input', actualizarVolumen);
actualizarVolumen(); // aplica el valor inicial de la barra

// Icono del instrumento (barra de abajo)
function crearIcono(id) {
  const personaje = porId.get(id);
  const icono = document.createElement('div');
  icono.className = 'icono';
  icono.dataset.id = id;
  icono.title = personaje.nombre;
  icono.style.setProperty('--color', personaje.color);

  const img = document.createElement('img');
  img.src = personaje.icono;
  img.alt = personaje.nombre;
  img.draggable = false; // evita el arrastre nativo de imágenes del navegador
  icono.appendChild(img);

  icono.addEventListener('pointerdown', iniciarArrastre);
  return icono;
}

function crearFicha(id) {
  const personaje = porId.get(id);
  const ficha = document.createElement('div');
  ficha.className = 'ficha';
  ficha.dataset.id = id;
  ficha.title = personaje.nombre;

  const img = document.createElement('img');
  img.src = personaje.imagen;
  img.alt = personaje.nombre;
  img.draggable = false; // evita el arrastre nativo de imágenes del navegador
  ficha.appendChild(img);

  ficha.addEventListener('pointerdown', iniciarArrastre);
  return ficha;
}

function crearBoton(texto, titulo, alClic) {
  const boton = document.createElement('button');
  boton.className = 'control';
  boton.textContent = texto;
  boton.title = titulo;
  boton.addEventListener('click', alClic);
  return boton;
}

function crearControles(id, indiceSlot) {
  const { muteada, solo } = infoMezcla(id);
  const controles = document.createElement('div');
  controles.className = 'controles';

  const btnMute = crearBoton('🔇', 'Silenciar', () => {
    alternarMute(id);
    render();
  });
  btnMute.classList.toggle('activo', muteada);

  const btnSolo = crearBoton('🎧', 'Solo este', () => {
    alternarSolo(id);
    render();
  });
  btnSolo.classList.toggle('activo', solo);

  const btnQuitar = crearBoton('✕', 'Quitar', () => {
    aplicar(quitar(indiceSlot));
    render();
  });

  controles.append(btnMute, btnSolo, btnQuitar);
  return controles;
}

function render() {
  const slots = obtenerSlots();
  const enUso = new Set(slots.filter(Boolean));

  barra.replaceChildren(
    ...personajes.map((p) => {
      const icono = crearIcono(p.id);
      icono.classList.toggle('en-uso', enUso.has(p.id));
      return icono;
    })
  );

  contenedorSlots.querySelectorAll('.slot').forEach((el, i) => {
    el.replaceChildren();
    const id = slots[i];
    el.classList.toggle('ocupado', Boolean(id));
    if (!id) return;

    const ficha = crearFicha(id);
    ficha.classList.toggle('pendiente', estadoPista(id) === 'pendiente');
    ficha.classList.toggle('silenciada', infoMezcla(id).silenciada);
    ficha.classList.toggle('entrando', id !== slotsAnteriores[i]); // solo si es nuevo en este slot
    ficha.appendChild(crearControles(id, i));
    el.appendChild(ficha);
  });
    slotsAnteriores = slots;
}

// Actualiza el parpadeo sin reconstruir los personajes (así no se corta la animación)
function actualizarEstados() {
  contenedorSlots.querySelectorAll('.ficha').forEach((ficha) => {
    ficha.classList.toggle('pendiente', estadoPista(ficha.dataset.id) === 'pendiente');
  });
}

function aplicar({ activar: idActivar, desactivar: idsDesactivar }) {
  idsDesactivar.forEach(desactivar);
  if (idActivar) activar(idActivar, actualizarEstados);
  detenerSiVacio(); // se revisa al final, cuando ya se aplicaron todos los cambios
}

function iniciarArrastre(evento) {
  if (evento.target.closest('.controles')) return; // clic en un botón, no es un arrastre
  evento.preventDefault();
  const origen = evento.currentTarget;
  const id = origen.dataset.id;
  const slotOrigen = origen.closest('.slot');

  const fantasma = origen.cloneNode(true);
  fantasma.classList.remove('en-uso', 'pendiente', 'entrando');
  fantasma.classList.add('fantasma');
  const caja = origen.getBoundingClientRect();
  fantasma.style.width = `${caja.width}px`;
  fantasma.style.height = `${caja.height}px`;
  fantasma.querySelector('.controles')?.remove(); // la copia que se arrastra no lleva botones
  document.body.appendChild(fantasma);

  const desfaseY = evento.pointerType === 'touch' ? -60 : 0; // con el dedo, la copia se ve arriba
  const mover = (e) => {
    fantasma.style.left = `${e.clientX}px`;
    fantasma.style.top = `${e.clientY + desfaseY}px`;
  };
  mover(evento);

  const terminar = (e) => {
    window.removeEventListener('pointermove', mover);
    window.removeEventListener('pointerup', terminar);
    window.removeEventListener('pointercancel', terminar);
    fantasma.remove();

    if (e.type === 'pointerup') {
      const destino = document.elementFromPoint(e.clientX, e.clientY + desfaseY)?.closest('.slot');
      if (destino) {
        aplicar(colocar(Number(destino.dataset.indice), id));
      } else if (slotOrigen) {
        aplicar(quitar(Number(slotOrigen.dataset.indice)));
      }
    }
    render();
  };

  window.addEventListener('pointermove', mover);
  window.addEventListener('pointerup', terminar);
  window.addEventListener('pointercancel', terminar);
}

// Actualiza el reloj en cada frame
function animarReloj() {
  reloj.style.setProperty('--p', progresoLoop());
  requestAnimationFrame(animarReloj);
}

cargarPistas(personajes)
  .then(() => {
    btnStart.disabled = false;
    estado.textContent = '';
  })
  .catch((error) => {
    console.error(error);
    estado.textContent = 'Error al cargar los sonidos';
  });

  async function intentarPantallaCompleta() {
  try {
    if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      await screen.orientation?.lock?.('landscape');
    }
  } catch {
    // no soportado: se ignora
  }
}

btnStart.addEventListener('click', async () => {
  intentarPantallaCompleta();
  await iniciar();
  inicio.hidden = true;
  juego.hidden = false;
  render();
  animarReloj();
});