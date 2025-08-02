// Mapeo simple de banderas por código de moneda (puedes expandirlo)
const FLAGS = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  ARS: '🇦🇷',
  BRL: '🇧🇷',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CNY: '🇨🇳',
  CLP: '🇨🇱',
  MXN: '🇲🇽',
  // ...agrega más si quieres
};

function getFlag(currency) {
  return FLAGS[currency] || '🏳️';
}
