const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

const form = document.getElementById('form-conversor');
const monedaOrigen = document.getElementById('moneda-origen');
const monedaDestino = document.getElementById('moneda-destino');
const montoInput = document.getElementById('monto');
const resultadoDiv = document.getElementById('resultado');
const tipoCambio = document.getElementById('tipo-cambio');
const toggleDark = document.getElementById('toggle-dark');

// Alternar modo oscuro
if (toggleDark) {
    toggleDark.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        toggleDark.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
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
    } catch (error) {
        resultadoDiv.textContent = 'Error al cargar monedas.';
    }
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
        return;
    }
    resultadoDiv.textContent = 'Convirtiendo...';
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
            return;
        }
        const convertido = monto * tasa;
        resultadoDiv.textContent = `${monto} ${origen} = ${convertido.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${destino}`;
    } catch (error) {
        resultadoDiv.textContent = 'Error al realizar la conversión.';
    }
});

cargarMonedas();
