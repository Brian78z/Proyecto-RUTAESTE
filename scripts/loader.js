/* ============================================================
   RUTAESTE · Pantalla de carga entre páginas
   - Se muestra al entrar a una página desde el menú principal
   - Dura MÍNIMO 3 segundos (y espera a que la página cargue)
   - Pon este script en el <head> de cada página, SIN defer
============================================================ */
(function () {
  var DURACION_MIN = 1000;                 // milisegundos
  var LOGO = '/img/LOGO.png';              // ruta del logo
  var FLAG = 'rutaeste_cargando';          // marca en sessionStorage

  var vieneDelMenu = false;
  try { vieneDelMenu = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}

  /* ---------- Estilos ---------- */
  var css = '' +
    '#pantallaCarga{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:22px;' +
    'background:linear-gradient(135deg,#123B5D 0%,#0E2A42 100%);color:#fff;' +
    'font-family:Arial,sans-serif;opacity:1;transition:opacity .5s ease;}' +
    '#pantallaCarga.visible{display:flex;}' +
    '#pantallaCarga.saliendo{opacity:0;}' +
    '#pantallaCarga .carga-logo{width:110px;height:110px;object-fit:contain;' +
    'animation:cargaLatido 1.4s ease-in-out infinite;}' +
    '#pantallaCarga .carga-titulo{font-size:22px;font-weight:bold;letter-spacing:2px;}' +
    '#pantallaCarga .carga-sub{font-size:15px;color:#F4F7FA;opacity:.9;margin-top:-14px;}' +
    '#pantallaCarga .carga-puntos::after{content:"";animation:cargaPuntos 1s steps(1,end) infinite;}' +
    '@keyframes cargaPuntos{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}' +
    '#pantallaCarga .carga-barra{width:220px;height:6px;border-radius:6px;' +
    'background:rgba(255,255,255,.2);overflow:hidden;}' +
    '#pantallaCarga .carga-barra span{display:block;height:100%;width:0;background:#F4C542;' +
    'border-radius:6px;animation:cargaBarra ' + DURACION_MIN + 'ms linear forwards;}' +
    '@keyframes cargaLatido{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}' +
    '@keyframes cargaBarra{from{width:0}to{width:100%}}' +
    'html.cargando,html.cargando body{overflow:hidden;}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Pantalla ---------- */
  var pantalla = document.createElement('div');
  pantalla.id = 'pantallaCarga';
  pantalla.innerHTML =
    '<img class="carga-logo" src="' + LOGO + '" alt="RUTAESTE">' +
    '<div class="carga-titulo">RUTAESTE</div>' +
    '<div class="carga-sub"><span class="carga-texto">Entrando a la aplicación</span><span class="carga-puntos"></span></div>' +
    '<div class="carga-barra"><span></span></div>';
  document.documentElement.appendChild(pantalla);

  function mostrar() {
    pantalla.classList.remove('saliendo');
    pantalla.classList.add('visible');
    document.documentElement.classList.add('cargando');
  }

  function ocultar() {
    pantalla.classList.add('saliendo');
    setTimeout(function () {
      pantalla.classList.remove('visible', 'saliendo');
      document.documentElement.classList.remove('cargando');
    }, 500);
  }

  /* ---------- Al llegar a la página nueva ---------- */
  if (vieneDelMenu) {
    try { sessionStorage.removeItem(FLAG); } catch (e) {}
    mostrar();

    var pasoTiempo = new Promise(function (ok) { setTimeout(ok, DURACION_MIN); });
    var pasoCarga  = new Promise(function (ok) {
      if (document.readyState === 'complete') ok();
      else window.addEventListener('load', ok);
    });
    Promise.all([pasoTiempo, pasoCarga]).then(ocultar);
  }

  /* ---------- Al hacer clic en el menú principal ---------- */
  // Solo botones del menú que NO sean de la navegación interna (data-page)
  document.addEventListener('click', function (e) {
    var boton = e.target.closest && e.target.closest('header nav button');
    if (!boton || boton.hasAttribute('data-page')) return;
    if (boton.classList.contains('active')) return;   // ya estás en esa página
    // Solo el botón que lleva a registro activa la pantalla de carga
    var destino = (boton.getAttribute('onclick') || '').toLowerCase();
    if (destino.indexOf('registro') === -1) return;
    try { sessionStorage.setItem(FLAG, '1'); } catch (err) {}
    mostrar();                                        // feedback inmediato
  }, true);

  /* ---------- Salir de la aplicación (botón "Volver a casa") ---------- */
  var saliendoYa = false;
  window.salirDeLaApp = function (url) {
    if (saliendoYa) return;                           // evita doble clic
    saliendoYa = true;
    pantalla.querySelector('.carga-texto').textContent = 'Saliendo de la aplicación';
    mostrar();
    setTimeout(function () { window.location.href = url; }, DURACION_MIN);
  };

  /* ---------- Botón "atrás" del navegador ---------- */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      saliendoYa = false;
      pantalla.querySelector('.carga-texto').textContent = 'Entrando a la aplicación';
      pantalla.classList.remove('visible', 'saliendo');
      document.documentElement.classList.remove('cargando');
    }
  });
})();
