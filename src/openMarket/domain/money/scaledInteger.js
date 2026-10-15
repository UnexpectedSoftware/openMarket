import InvalidMoneyError from './InvalidMoneyError';

/**
 * Half-up integer from a decimal, scaled by 100 (cents) or 1000 (milli-units).
 * The decimal is parsed from its text. It is never multiplied as a float.
 * @param {number | string} value
 * @param {number} scale
 * @returns {number}
 */
export default function scaledInteger(value, scale) {
  const text = decimalText(value);
  const match = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match || !Number.isInteger(scale) || scale < 1) {
    throw new InvalidMoneyError({
      message: 'Amount is not a decimal number',
      value: text
    });
  }
  const sign = match[1] === '-' ? -1 : 1;
  const scaleDigits = String(scale).length - 1;
  const fraction = match[3] || '';
  const digits = (fraction + '0'.repeat(scaleDigits)).slice(0, scaleDigits);
  const rest = fraction.slice(scaleDigits);
  let scaled = Number(match[2]) * scale + Number(digits || '0');
  if (rest.length > 0 && rest[0] >= '5') {
    scaled += 1;
  }
  if (!Number.isSafeInteger(scaled)) {
    throw new InvalidMoneyError({
      message: 'Amount is outside the range that can be stored exactly',
      value: text
    });
  }
  return sign * scaled;
}

/**
 * @param {number | string} value
 * @returns {string}
 */
function decimalText(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new InvalidMoneyError({
        message: 'Amount is not a finite number',
        value: String(value)
      });
    }
    const text = String(value);
    if (!/[eE]/.test(text)) {
      return text;
    }
    return value.toFixed(20).replace(/\.?0+$/, '');
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') {
      throw new InvalidMoneyError({message: 'Amount is empty', value: text});
    }
    return text;
  }
  throw new InvalidMoneyError({
    message: 'Amount is not a decimal number',
    value: value == null ? String(value) : undefined
  });
}
