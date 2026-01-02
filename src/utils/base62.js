const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function encodeBase62(num) {
  let result = "";

  while (num > 0) {
    const remainder = num % 62;
    result = CHARSET[remainder] + result;
    num = Math.floor(num / 62);
  }

  return result;
}

module.exports = encodeBase62;
