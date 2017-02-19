// returns a string with the given symbol
exports.symbolTimes = (symbol, times) => {
  const arr = [];
  for (let i = 0; i < times; i++) {
    arr.push(symbol);
  }
  return arr.join('');
};

exports.randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};
