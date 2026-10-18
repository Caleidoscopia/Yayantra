// Un personaje = un sonido. Para sumar uno nuevo, agregá una línea.
export const datos = [
  { id: 'p1', nombre: 'Personaje 1', archivo: '/audio/loop1.wav', imagen: '/img/personaje1.png', icono: '/img/pads.png', color: '#3fd387' },
  { id: 'p2', nombre: 'Personaje 2', archivo: '/audio/loop2.wav', imagen: '/img/personaje2.png', icono: '/img/arpa.png', color: '#9f5de0' },
  { id: 'p3', nombre: 'Personaje 3', archivo: '/audio/loop3.wav', imagen: '/img/personaje3.png', icono: '/img/theremin.png', color: '#6e9ee0' },
  { id: 'p4', nombre: 'Personaje 4', archivo: '/audio/loop4.wav', imagen: '/img/personaje4.png', icono: '/img/candle.png', color: '#a38ad1' },
  { id: 'p5', nombre: 'Personaje 5', archivo: '/audio/loop5.wav', imagen: '/img/personaje5.png', icono: '/img/bateria.png', color: '#EEAC42' },
  { id: 'p6', nombre: 'Personaje 6', archivo: '/audio/loop6.wav', imagen: '/img/personaje6.png', icono: '/img/pads.png', color: '#3fd387' },
  { id: 'p7',  nombre: 'Personaje 7',  archivo: '/audio/loop7.wav',  imagen: '/img/personaje7.png', icono: '/img/campanas.png', color: '#e9cb46' },
  { id: 'p8',  nombre: 'Personaje 8',  archivo: '/audio/loop8.wav',  imagen: '/img/personaje8.png', icono: '/img/guitar.png', color: '#eb8ace' },
  { id: 'p9',  nombre: 'Personaje 9',  archivo: '/audio/loop9.wav',  imagen: '/img/personaje9.png', icono: '/img/tambor.png', color: '#469aee' },
  { id: 'p10', nombre: 'Personaje 10', archivo: '/audio/loop10.wav', imagen: '/img/personaje10.png', icono: '/img/arpa.png', color: '#9f5de0' },
  { id: 'p11', nombre: 'Personaje 11', archivo: '/audio/loop11.wav', imagen: '/img/personaje11.png', icono: '/img/pads.png', color: '#3fd387' },
];

// Agrega el prefijo del sitio a cada ruta ('/Yayantra/' en GitHub Pages, '/' en local)
const base = import.meta.env.BASE_URL;
const ruta = (r) => base + r.replace(/^\//, '');

export const personajes = datos.map((p) => ({
  ...p,
  archivo: ruta(p.archivo),
  imagen: ruta(p.imagen),
  icono: ruta(p.icono),
}));