const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

const form = document.getElementById('form-conversor');
const monedaOrigen = document.getElementById('moneda-origen');
const monedaDestino = document.getElementById('moneda-destino');
const montoInput = document.getElementById('monto');
const resultadoDiv = document.getElementById('resultado');
const tipoCambio = document.getElementById('tipo-cambio');
const toggleDark = document.getElementById('toggle-dark');
const iconMoon = document.getElementById('icon-moon');
const iconSun = document.getElementById('icon-sun');

// Alternar modo oscuro con switch animado
if (toggleDark) {
    toggleDark.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        // Animación SVG: alternar opacidad de luna y sol
        if (document.body.classList.contains('dark')) {
            iconMoon.style.opacity = '0';
            iconSun.style.opacity = '1';
        } else {
            iconMoon.style.opacity = '1';
            iconSun.style.opacity = '0';
        }
        guardarPreferencias && guardarPreferencias();
    });
}

// Cargar banderas
import('./flags.js').then(({getFlag}) => {
  window.getFlag = getFlag;
});

const flagOrigen = document.getElementById('flag-origen');
const flagDestino = document.getElementById('flag-destino');
const copiarBtn = document.getElementById('copiar-resultado');
const historialList = document.getElementById('lista-historial');
const resultadoContainer = document.getElementById('resultado-container');
const graficoCanvas = document.getElementById('grafico-tendencia');
let historial = JSON.parse(localStorage.getItem('historial-conversiones') || '[]');
let favoritos = JSON.parse(localStorage.getItem('favoritos-conversor') || '[]');

// Mostrar banderas
function actualizarBanderas() {
  if (window.getFlag) {
    flagOrigen.textContent = window.getFlag(monedaOrigen.value);
    flagDestino.textContent = window.getFlag(monedaDestino.value);
  }
}
monedaOrigen.addEventListener('change', actualizarBanderas);
monedaDestino.addEventListener('change', actualizarBanderas);

// Guardar preferencias
function guardarPreferencias() {
  localStorage.setItem('preferencias-conversor', JSON.stringify({
    origen: monedaOrigen.value,
    destino: monedaDestino.value,
    tipo: tipoCambio.value,
    dark: document.body.classList.contains('dark')
  }));
}
[monedaOrigen, monedaDestino, tipoCambio].forEach(el => el.addEventListener('change', guardarPreferencias));

// Cargar preferencias
function cargarPreferencias() {
  const pref = JSON.parse(localStorage.getItem('preferencias-conversor') || '{}');
  if (pref.origen) monedaOrigen.value = pref.origen;
  if (pref.destino) monedaDestino.value = pref.destino;
  if (pref.tipo) tipoCambio.value = pref.tipo;
  if (pref.dark) document.body.classList.add('dark');
}

// Copiar resultado
copiarBtn.addEventListener('click', () => {
  const text = document.getElementById('resultado').textContent;
  if (text) {
    navigator.clipboard.writeText(text);
    copiarBtn.classList.add('copiado');
    copiarBtn.textContent = '✔️';
    setTimeout(() => {
      copiarBtn.classList.remove('copiado');
      copiarBtn.textContent = '📋';
    }, 1200);
  }
});

// Mostrar historial
function renderHistorial() {
  historialList.innerHTML = '';
  historial.slice(-8).reverse().forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = `${item.monto} ${item.origen} → ${item.convertido} ${item.destino} (${item.tipo})`;
    li.style.animationDelay = `${i * 0.07}s`;
    historialList.appendChild(li);
  });
}

// Guardar en historial
function agregarHistorial(item) {
  historial.push(item);
  if (historial.length > 20) historial = historial.slice(-20);
  localStorage.setItem('historial-conversiones', JSON.stringify(historial));
  renderHistorial();
}

// Mostrar gráfico de tendencia (últimos 7 días)
async function mostrarGrafico(origen, destino) {
  if (!window.Chart) {
    await cargarChartJs();
  }
  // Simulación: genera datos aleatorios para demo
  const labels = [];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('es-ES', {month:'short', day:'numeric'}));
    data.push((Math.random() * 0.2 + 0.9).toFixed(3));
  }
  const ctx = graficoCanvas.getContext('2d');
  if (window.graficoTendencia) window.graficoTendencia.destroy();
  window.graficoTendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `Tendencia ${origen}/${destino}`,
        data,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.08)',
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#007bff',
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } },
      animation: { duration: 900, easing: 'easeOutQuart' },
      responsive: true,
    }
  });
}
async function cargarChartJs() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

// Llenar select con monedas disponibles desde la API
async function cargarMonedas() {
    try {
        const res = await fetch(API_URL + 'USD');
        const data = await res.json();
        const monedas = Object.keys(data.rates);
        monedas.sort();
        monedas.forEach(moneda => {
            const option1 = document.createElement('option');
            option1.value = moneda;
            option1.textContent = moneda;
            monedaOrigen.appendChild(option1);
            const option2 = document.createElement('option');
            option2.value = moneda;
            option2.textContent = moneda;
            monedaDestino.appendChild(option2);
        });
        monedaOrigen.value = 'USD';
        monedaDestino.value = 'EUR';
        actualizarBanderas();
        cargarPreferencias();
        renderHistorial();
    } catch (error) {
        resultadoDiv.textContent = 'Error al cargar monedas.';
    }
}

// Toast notifications
function showToast(msg, color = '#007bff') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 500);
  }, 1800);
}

// Favoritos
const listaFavoritos = document.getElementById('lista-favoritos');
function renderFavoritos() {
  listaFavoritos.innerHTML = '';
  favoritos.forEach((f, i) => {
    const li = document.createElement('li');
    li.textContent = `${f.origen} → ${f.destino} (${f.tipo})`;
    li.style.animationDelay = `${i * 0.07}s`;
    const btn = document.createElement('button');
    btn.textContent = '✖️';
    btn.title = 'Quitar favorito';
    btn.onclick = () => { favoritos.splice(i,1); guardarFavoritos(); renderFavoritos(); showToast('Favorito eliminado','crimson'); };
    li.appendChild(btn);
    li.onclick = (e) => {
      if (e.target !== btn) {
        monedaOrigen.value = f.origen;
        monedaDestino.value = f.destino;
        tipoCambio.value = f.tipo;
        guardarPreferencias();
        showToast('Favorito cargado','orange');
      }
    };
    listaFavoritos.appendChild(li);
  });
}
function guardarFavoritos() {
  localStorage.setItem('favoritos-conversor', JSON.stringify(favoritos));
}
function agregarFavorito() {
  const f = {
    origen: monedaOrigen.value,
    destino: monedaDestino.value,
    tipo: tipoCambio.value
  };
  if (!favoritos.some(x => x.origen===f.origen && x.destino===f.destino && x.tipo===f.tipo)) {
    favoritos.push(f);
    guardarFavoritos();
    renderFavoritos();
    showToast('Favorito agregado','goldenrod');
  } else {
    showToast('Ya está en favoritos','gray');
  }
}
// Botón para agregar favorito (puedes ponerlo donde prefieras)
if (!document.getElementById('agregar-fav')) {
  const btnFav = document.createElement('button');
  btnFav.id = 'agregar-fav';
  btnFav.textContent = '⭐ Agregar a favoritos';
  btnFav.type = 'button';
  btnFav.style.marginTop = '0.5em';
  btnFav.onclick = agregarFavorito;
  document.getElementById('form-conversor').appendChild(btnFav);
}
renderFavoritos();

// Exportar historial a CSV
function exportarCSV() {
  let csv = 'Fecha,Origen,Destino,Tipo,Monto,Convertido\n';
  historial.forEach(h => {
    csv += `${h.fecha},${h.origen},${h.destino},${h.tipo},${h.monto},${h.convertido}\n`;
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'historial_conversiones.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Historial exportado a CSV','green');
}
document.getElementById('exportar-csv').onclick = exportarCSV;

// Exportar historial a PDF (simple)
function exportarPDF() {
  let win = window.open('', '', 'width=700,height=600');
  win.document.write('<h2>Historial de conversiones</h2><ul>');
  historial.forEach(h => {
    win.document.write(`<li>${h.fecha} - ${h.monto} ${h.origen} → ${h.convertido} ${h.destino} (${h.tipo})</li>`);
  });
  win.document.write('</ul>');
  win.print();
  win.close();
  showToast('Historial enviado a imprimir','green');
}
document.getElementById('exportar-pdf').onclick = exportarPDF;

// Voz: leer resultado
if ('speechSynthesis' in window) {
  document.getElementById('leer-resultado').onclick = () => {
    const text = document.getElementById('resultado').textContent;
    if (text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      window.speechSynthesis.speak(utter);
      showToast('Leyendo resultado','purple');
    }
  };
}
// Voz: dictar monto
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  document.getElementById('dictar-monto').onclick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = 'es-ES';
    recog.onresult = (e) => {
      const val = e.results[0][0].transcript.replace(/[^\d.,]/g,'').replace(',','.');
      montoInput.value = val;
      showToast('Monto dictado: '+val,'#007bff');
    };
    recog.start();
  };
}

// Autocompletar monedas
[monedaOrigen, monedaDestino].forEach(select => {
  select.setAttribute('autocomplete','on');
  select.setAttribute('aria-autocomplete','list');
});

// Accesibilidad: teclas rápidas
window.addEventListener('keydown', e => {
  if (e.altKey && e.key === 'c') copiarBtn.click();
  if (e.altKey && e.key === 'f') agregarFavorito();
});

// PWA: registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

// Lógica de conversión
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const origen = monedaOrigen.value;
    const destino = monedaDestino.value;
    const monto = parseFloat(montoInput.value);
    const tipo = tipoCambio.value;
    if (!origen || !destino || isNaN(monto) || monto <= 0) {
        resultadoDiv.textContent = 'Por favor, complete todos los campos correctamente.';
        copiarBtn.style.display = 'none';
        return;
    }
    resultadoDiv.textContent = 'Convirtiendo...';
    copiarBtn.style.display = 'none';
    try {
        let tasa;
        if (tipo === 'oficial') {
            const res = await fetch(API_URL + origen);
            const data = await res.json();
            tasa = data.rates[destino];
        } else if (tipo === 'blue' || tipo === 'mep') {
            // Ejemplo: API alternativa para blue/MEP (puedes cambiar la URL por una real si tienes acceso)
            // Aquí se usa una API pública de referencia para el peso argentino
            if ((origen === 'ARS' || destino === 'ARS')) {
                const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
                const data = await res.json();
                let valor;
                if (tipo === 'blue') valor = data.blue;
                else valor = data.mep;
                if (origen === 'ARS' && destino !== 'ARS') {
                    // De ARS a otra moneda
                    const oficialRes = await fetch(API_URL + 'ARS');
                    const oficialData = await oficialRes.json();
                    const tasaOficial = oficialData.rates[destino];
                    tasa = (1 / valor.value_sell) * tasaOficial;
                } else if (destino === 'ARS' && origen !== 'ARS') {
                    // De otra moneda a ARS
                    const oficialRes = await fetch(API_URL + origen);
                    const oficialData = await oficialRes.json();
                    const tasaOficial = oficialData.rates['ARS'];
                    tasa = valor.value_buy / tasaOficial;
                } else if (origen === 'ARS' && destino === 'ARS') {
                    tasa = 1;
                } else {
                    // Conversión entre monedas que no son ARS usando oficial
                    const res = await fetch(API_URL + origen);
                    const data = await res.json();
                    tasa = data.rates[destino];
                }
            } else {
                // Si ninguna es ARS, usar oficial
                const res = await fetch(API_URL + origen);
                const data = await res.json();
                tasa = data.rates[destino];
            }
        }
        if (!tasa) {
            resultadoDiv.textContent = 'No se pudo obtener la tasa de cambio.';
            copiarBtn.style.display = 'none';
            return;
        }
        const convertido = (monto * tasa).toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        resultadoDiv.textContent = `${monto} ${origen} = ${convertido} ${destino}`;
        copiarBtn.style.display = '';
        agregarHistorial({
          monto,
          origen,
          destino,
          convertido,
          tipo,
          fecha: new Date().toISOString()
        });
        mostrarGrafico(origen, destino);
    } catch (error) {
        resultadoDiv.textContent = 'Error al realizar la conversión.';
        copiarBtn.style.display = 'none';
    }
});

cargarMonedas();
