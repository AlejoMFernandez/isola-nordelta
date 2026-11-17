const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
let kit = null;

/* ---------- hora de Buenos Aires y estado ---------- */
const ahoraBA = () => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  return { dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') };
};
const HOR = { 0: [720, 960], 1: null, 2: [720, 1440], 3: [720, 1440], 4: [720, 1440], 5: [720, 1440], 6: [720, 1440] };
const hh = m => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`;
const DIAS = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
function estado() {
  const { dia, min } = ahoraBA(), h = HOR[dia];
  if (h && min >= h[0] && min < h[1]) return { ok: true, txt: `Abierto ahora · hasta las ${hh(h[1])} hs` };
  if (h && min < h[0]) return { ok: false, txt: `Hoy abrimos a las ${hh(h[0])} hs` };
  let d = (dia + 1) % 7; while (!HOR[d]) d = (d + 1) % 7;
  return { ok: false, txt: `Cerrado · abrimos ${d === (dia + 1) % 7 ? 'mañana' : DIAS[d]} a las 12:00 hs` };
}
const e0 = estado();
$$('[data-estado]').forEach(el => { el.classList.toggle('cerrado', !e0.ok); el.querySelector('span').textContent = e0.txt; });
{ const { dia } = ahoraBA(); $$('.horarios li').forEach(li => li.classList.toggle('hoy', li.dataset.d.split(',').includes(String(dia)))); }

/* ---------- cabecera y menú ---------- */
const hero = $('.hero-a');
new IntersectionObserver(([x]) => document.body.classList.toggle('pasado', !x.isIntersecting), { threshold: 0.12 }).observe(hero);
const bt = $('.ojito'), menu = $('#menu');
const setMenu = v => { bt.setAttribute('aria-expanded', v); bt.setAttribute('aria-label', v ? 'Cerrar el menú' : 'Abrir el menú'); menu.classList.toggle('abierto', v); document.documentElement.classList.toggle('menu-on', v); };
bt.addEventListener('click', () => setMenu(bt.getAttribute('aria-expanded') !== 'true'));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------- la píldora del panel no tapa el hero ni el WOW en el celu ---------- */
{
  const vis = new Map(); const celu = matchMedia('(max-width: 899px)');
  const hero = $('.hero-a'), wow = $('#dia'), pie = $('.pie');
  const upd = () => document.documentElement.classList.toggle('pill-oculta', !!(vis.get(hero) || vis.get(pie) || (celu.matches && vis.get(wow))));
  const ob = new IntersectionObserver(es => { es.forEach(x => vis.set(x.target, x.isIntersecting)); upd(); }, { threshold: 0.05 });
  [hero, wow, pie].forEach(el => ob.observe(el)); celu.addEventListener('change', upd);
}

/* ---------- la barra cambia a cal sobre fondos oscuros ---------- */
{
  let raf = 0;
  const chequear = () => { raf = 0; const y = 40; const els = document.elementsFromPoint(innerWidth / 2, y);
    const os = els.find(e => e.closest && e.closest('.detalles, .pie, .dia[data-m="cena"], .reservas, .menu.abierto'));
    document.body.classList.toggle('cab-oscura', !!os); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(chequear); }, { passive: true });
  document.addEventListener('click', () => setTimeout(chequear, 50)); chequear();
}

/* ---------- entradas: la marea ---------- */
const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('visto'); io.unobserve(x.target); } }), { threshold: 0.18 });
$$('.rv, .rv-sube').forEach(el => io.observe(el));

/* ---------- filas que se arrastran con el mouse (desde cualquier punto) ---------- */
function arrastrable(el) {
  let x0 = 0, s0 = 0, mov = false, abajo = false;
  el.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse' || el.scrollWidth <= el.clientWidth + 2) return; abajo = true; mov = false; x0 = ev.clientX; s0 = el.scrollLeft; });
  addEventListener('pointermove', ev => { if (!abajo) return; const dx = ev.clientX - x0; if (!mov && Math.abs(dx) > 5) { mov = true; el.classList.add('arrastra'); } if (mov) el.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => {
    if (!abajo) return; abajo = false;
    if (mov) { el.classList.remove('arrastra'); const c = el.firstElementChild; const w = c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 16) : 200; el.scrollTo({ left: Math.round(el.scrollLeft / w) * w, behavior: 'smooth' }); setTimeout(() => { mov = false; }, 0); }
  });
  el.addEventListener('click', ev => { if (mov) { ev.preventDefault(); ev.stopImmediatePropagation(); } }, true);
  el.addEventListener('dragstart', ev => ev.preventDefault());
}
$$('.arrastrable').forEach(arrastrable);

/* ---------- WOW: un día en ISOLA ---------- */
const M = {
  lunch: { t: 'Lunch by ISOLA', c: 'Martes a viernes, desde las 12:00 hs', l: 'Principal + platito o postre + bebida + café · $34.400', a: 150, hora: '12:30', res: 'Reservar lunch',
    p: [['lunch', 'Menú lunch', '$34.400', 'Principal + platito o postre + bebida + café. Con platito y postre: $36.900.'],
        ['bife', 'Bife de chorizo', 'En el menú lunch', 'Guarnición a elección: ensalada rúcula parmesano o papas fritas. Upgrade a ojo de bife: $6.500.'],
        ['cesar', 'Ensalada César', 'En el menú lunch', 'Lechuga. Crutones. Parmesano. Pollo. Polvo de panceta.']] },
  merienda: { t: 'La merienda', c: 'Martes a sábado, desde las 16:00 hs', l: 'Salado y dulce, desde $4.600', a: 92, hora: '16:30', res: 'Reservar merienda',
    p: [['tostada', 'Tostada con trucha', '$14.000', 'Pan. Trucha ahumada. Crema ácida. Rabanito. Eneldo.'],
        ['torta', 'Torta de chocolate', '$15.700', 'Bizcocho de chocolate. Dulce de leche. Frosting de cacao y queso crema. Para compartir.'],
        ['alfajor', 'Alfajor de almendra', '$4.600', 'Alfajor con dulce de leche. Almendras.']] },
  cena: { t: 'La cena', c: 'Martes a sábado, desde las 20:00 hs', l: 'Vermouth de cortesía al llegar.', a: 32, hora: '21:00', res: 'Reservar cena',
    p: [['gambas', 'Gambas de ajillo', '$31.200', 'Langostinos. Aceite de oliva. Ajo. Pimentón.'],
        ['burrata', 'Burrata', '$32.000', 'Tomates cherry confitados en aceto balsámico. Gremolata. Tostada. Opción sin gluten.'],
        ['pulpo', 'Pulpo español', '$79.600', 'Pulpo cocido a baja temperatura. Mayonesa de pulpo. Garbanzo, papa y panceta o papas fritas.'],
        ['agnolotti', 'Agnolotti trufado', '$38.200', 'Carrillera braseada. Demi-glace. Marsala. Avellanas. Parmesano. Aceite de trufa.']] },
};
const dia = $('#dia'), svg = $('.dia__arco'), sol = $('.sol', svg), info = $('.dia__info'), ul = $('.platos'), ficha = $('.ficha');
const CX = 500, CY = 520, R = 380;
const pos = a => [CX + R * Math.cos(a * Math.PI / 180), CY - R * Math.sin(a * Math.PI / 180)];
const ponSol = a => { const [x, y] = pos(a); sol.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); };
let VB = [0, 0, 1000, 545];
function ubicar() {
  const celu = innerWidth < 900; VB = celu ? [64, 92, 872, 453] : [0, 0, 1000, 545];
  svg.setAttribute('viewBox', VB.join(' ')); svg.parentElement.style.aspectRatio = VB[2] + ' / ' + VB[3];
  $$('.estacion').forEach(b => {
    if (celu) { b.style.left = b.style.top = ''; return; }
    const a = { lunch: 167, merienda: 90, cena: 13 }[b.dataset.ir], f = b.dataset.ir === 'merienda' ? 1.3 : 1.24, x = CX + R * f * Math.cos(a * Math.PI / 180), y = CY - R * f * Math.sin(a * Math.PI / 180);
    b.style.left = (x / 10) + '%'; b.style.top = (y / 545 * 100) + '%';
  });
}
ubicar(); addEventListener('resize', ubicar, { passive: true });
let actual = null;
function ir(m, anim = true) {
  if (m === actual) { ponSol(M[m].a); return; }
  actual = m; const d = M[m];
  dia.dataset.m = m; ponSol(d.a); cerrarFicha();
  $$('.estacion').forEach(b => b.setAttribute('aria-pressed', b.dataset.ir === m));
  info.querySelector('h3').textContent = d.t; info.querySelector('.cuando').textContent = d.c; info.querySelector('.linea').textContent = d.l;
  ul.innerHTML = d.p.map((p, k) => `<li style="--k:${k}"><button class="plato" type="button" data-k="${k}"><span class="plato__foto"><img src="img/p-${p[0]}-360.webp" srcset="img/p-${p[0]}-360.webp 360w, img/p-${p[0]}-640.webp 640w" sizes="160px" alt="" width="360" height="360" loading="lazy" decoding="async"></span><span class="plato__nom">${p[1]}</span><span class="plato__pre">${p[2]}</span></button></li>`).join('');
  ul.scrollLeft = 0;
  if (anim) [info, ul].forEach(el => { el.classList.remove('cambia'); void el.offsetWidth; el.classList.add('cambia'); });
}
$$('.estacion').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
const angulo = ev => {
  const r = svg.getBoundingClientRect(); const x = VB[0] + (ev.clientX - r.left) / r.width * VB[2], y = VB[1] + (ev.clientY - r.top) / r.height * VB[3];
  let a = Math.atan2(CY - y, x - CX) * 180 / Math.PI; if (a < 0) a = x < CX ? 180 : 0; return Math.max(8, Math.min(172, a));
};
const cercano = a => Object.keys(M).reduce((m, k) => Math.abs(M[k].a - a) < Math.abs(M[m].a - a) ? k : m, 'lunch');
let arr = false;
sol.addEventListener('pointerdown', ev => { arr = true; svg.classList.add('arrastrando'); svg.setPointerCapture(ev.pointerId); ev.preventDefault(); });
svg.addEventListener('pointermove', ev => { if (!arr) return; const a = angulo(ev), c = cercano(a); if (c !== actual) ir(c); ponSol(a); });
const soltar = () => { if (!arr) return; arr = false; svg.classList.remove('arrastrando'); ponSol(M[actual].a); };
svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
svg.addEventListener('click', ev => { if (ev.target.closest('.sol')) return; ir(cercano(angulo(ev))); });

const velo = $('.velo');
function cerrarFicha() { ficha.hidden = true; velo.hidden = true; }
{ let y0 = 0; addEventListener('scroll', () => { if (ficha.hidden) { y0 = scrollY; return; } if (Math.abs(scrollY - y0) > 80) cerrarFicha(); }, { passive: true }); }
ul.addEventListener('click', ev => {
  const b = ev.target.closest('.plato'); if (!b) return; const p = M[actual].p[+b.dataset.k];
  const img = $('.ficha__foto', ficha); img.removeAttribute('src'); img.src = `img/p-${p[0]}-640.webp`;
  $('.ficha__mom', ficha).textContent = M[actual].t; $('.ficha__nom', ficha).textContent = p[1];
  $('.ficha__desc', ficha).textContent = p[3]; $('.ficha__pre', ficha).textContent = p[2];
  $('.ficha__res', ficha).textContent = M[actual].res;
  ficha.hidden = false; velo.hidden = !matchMedia('(max-width: 899px)').matches; ficha.classList.remove('abre'); void ficha.offsetWidth; ficha.classList.add('abre');
  $('.ficha__x', ficha).focus({ preventScroll: true });
});
$('.ficha__x', ficha).addEventListener('click', cerrarFicha);
$('.ficha__res', ficha).addEventListener('click', () => { const h = M[actual].hora; cerrarFicha(); abrirReserva({ hora: h }); });
document.addEventListener('pointerdown', ev => { if (!ficha.hidden && !ev.target.closest('.ficha') && !ev.target.closest('.plato')) cerrarFicha(); });
document.addEventListener('keydown', ev => { if (ev.key !== 'Escape') return; if (!ficha.hidden) cerrarFicha(); if (menu.classList.contains('abierto')) setMenu(false); });
{
  const q = new URLSearchParams(location.search).get('momento');
  const { dia: d0, min } = ahoraBA();
  const deAhora = min < 16 * 60 ? 'lunch' : min < 19.5 * 60 ? 'merienda' : 'cena';
  ir(M[q] ? q : (HOR[d0] && d0 !== 0 ? deAhora : 'lunch'), false);
}

/* ---------- la casa ---------- */
{
  const fotos = $$('.casa__fotos img'), btns = $$('.esp'), descs = $$('.esp__desc p'); let i0 = 0;
  const elegir = i => {
    if (i === i0) return;
    const viejo = fotos[i0]; viejo.classList.remove('on'); viejo.classList.add('sale');
    const nueva = fotos[i]; nueva.loading = 'eager';
    const mostrar = () => { nueva.classList.add('on'); setTimeout(() => viejo.classList.remove('sale'), 950); };
    nueva.complete ? mostrar() : nueva.addEventListener('load', mostrar, { once: true });
    btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i)); descs.forEach((p, k) => { p.hidden = k !== i; });
    i0 = i;
  };
  btns.forEach(b => { b.addEventListener('click', () => elegir(+b.dataset.i)); if (matchMedia('(hover: hover)').matches) b.addEventListener('pointerenter', () => elegir(+b.dataset.i)); });
}

/* ---------- cada detalle cuenta: flechas ---------- */
{
  const tira = $('.tira');
  $$('.flecha').forEach(f => f.addEventListener('click', () => { const w = tira.firstElementChild.getBoundingClientRect().width + 24; tira.scrollBy({ left: +f.dataset.dir * w * 2, behavior: 'smooth' }); }));
}

/* ---------- la carta (placa) ---------- */
const cartaEl = $('#carta-kit'), cfImg = $('.cf__img');
const FOTO_CAT = { platillos: 'p-gambas-640', ensaladas: 'p-cesar-640', principales: 'p-pulpo-640', acompanamientos: 'p-bife-640', postres: 'p-torta-640', estacion: 't-pasta-520', lunch: 'p-lunch-640', merienda: 'p-tostada-640' };
const BAJADA = { estacion: 'Platos de primavera · la hamburguesa ISOLA, sábados y domingos al mediodía', lunch: 'Martes a viernes al mediodía · principal + platito o postre + bebida + café: $34.400 · con los tres: $36.900 · copa de vino $8.800 · mocktail $7.000', merienda: 'Salado y dulce, por la tarde' };
let cats = [], catActual = null, imgCat = '';
const GF = '<i class="gf" title="Sin gluten" aria-label="Sin gluten"></i>';
const plantilla = (p, ctx) => {
  const pr = ctx.money(p.precio);
  const precio = p.categoria === 'lunch' && p.precio == null ? '<span class="pr combo">En el menú</span>' : `<span class="pr">${pr ?? 'Consultar'}</span>`;
  return `<div class="it-t"><h3>${esc(p.nombre)}${(p.etiquetas || []).includes('Sin gluten') ? GF : ''}${p.foto ? '<i class="pt" aria-hidden="true"></i>' : ''}</h3>${p.foto ? `<img class="it-mini" src="${esc(ctx.asset(p.foto)).replace('-640.', '-360.')}" alt="Foto: ${esc(p.nombre)}" width="360" height="360" loading="lazy" decoding="async">` : ''}${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}</div>${precio}`;
};
function ponerImg(src) {
  if (!cfImg || cfImg.getAttribute('src') === src) return;
  cfImg.classList.add('cambia');
  const pre = new Image(); pre.onload = () => { cfImg.src = src; cfImg.classList.remove('cambia'); }; pre.src = src;
}
function mostrarCat(id) {
  catActual = id;
  imgCat = `img/${FOTO_CAT[id] || 'p-gambas-640'}.webp`; ponerImg(imgCat);
  const tabs = $$('.kit-tab', cartaEl), i = tabs.findIndex(t => t.dataset.cat === id);
  const ant = $('.cp-ant'), sig = $('.cp-sig');
  ant.hidden = i <= 0; sig.hidden = i >= tabs.length - 1;
  $('span', ant).textContent = tabs[i - 1]?.textContent || ''; $('span', sig).textContent = tabs[i + 1]?.textContent || '';
}
document.addEventListener('kit:carta', e => {
  if (e.detail.el !== cartaEl) return;
  cats = e.detail.categorias || [];
  $$('.kit-carta__panel', cartaEl).forEach(p => {
    const id = p.querySelector('.kit-item')?.dataset.cat; const c = cats.find(x => x.id === id); if (!c) return;
    p.insertAdjacentHTML('afterbegin', `<div class="placa__t"><h3>${esc(c.nombre)}</h3><i aria-hidden="true"></i></div>${BAJADA[id] ? `<p class="placa__b">${esc(BAJADA[id])}</p>` : ''}`);
  });
  const on = $('.kit-tab.is-on', cartaEl); mostrarCat(on ? on.dataset.cat : cats[0]?.id);
});
cartaEl.addEventListener('click', e => { const t = e.target.closest('.kit-tab'); if (t) setTimeout(() => { mostrarCat(t.dataset.cat); t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, 0); });
const paso = d => { const tabs = $$('.kit-tab', cartaEl), i = tabs.findIndex(t => t.dataset.cat === catActual); tabs[i + d]?.click(); $('.placa').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' }); };
$('.cp-ant').addEventListener('click', () => paso(-1));
$('.cp-sig').addEventListener('click', () => paso(1));
if (matchMedia('(hover: hover)').matches) {
  let raf = 0;
  cartaEl.addEventListener('pointerover', e => { const it = e.target.closest('.it[data-photo]'); cancelAnimationFrame(raf); raf = requestAnimationFrame(() => ponerImg(it ? it.dataset.photo : imgCat)); });
  cartaEl.addEventListener('pointerleave', () => ponerImg(imgCat));
}

/* ---------- reservas (kit) ---------- */
function abrirReserva(op = {}) { if (kit?.reservas?.abrir) kit.reservas.abrir({ personas: 2, ...op }); }

try {
  const { initKit } = await import('../kit/kit.js?v=1');
  kit = await initKit({ config: 'cliente.json', imagenes: { lqip: 'img/lqip.json' }, carta: { itemClass: 'it', template: plantilla, pedir: false }, badge: true });
} catch (err) { console.warn('[isola] kit', err); }
