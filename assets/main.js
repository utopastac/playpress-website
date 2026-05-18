function formatMoney(cents, format) {
  if (typeof cents === 'string') { cents = cents.replace('.', ''); }

  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || '';
  const match = formatString.match(placeholderRegex);
  if (!match) { return formatString; }

  function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
    if (isNaN(number) || number == null) { return '0'; }
    number = (number / 100.0).toFixed(precision);
    const [dollars, centsStr] = number.split('.');
    return dollars.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`) + (centsStr ? decimal + centsStr : '');
  }

  let value = '';
  switch (match[1]) {
    case 'amount':                                  value = formatWithDelimiters(cents, 2); break;
    case 'amount_no_decimals':                      value = formatWithDelimiters(cents, 0); break;
    case 'amount_with_comma_separator':             value = formatWithDelimiters(cents, 2, '.', ','); break;
    case 'amount_no_decimals_with_comma_separator': value = formatWithDelimiters(cents, 0, '.', ','); break;
  }

  return formatString.replace(placeholderRegex, value);
}

window.formatMoney = formatMoney;
