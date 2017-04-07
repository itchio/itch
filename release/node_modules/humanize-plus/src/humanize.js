/**
 * Copyright 2013-2016 HubSpotDev
 * MIT Licensed
 *
 * @module humanize.js
 */

((root, factory) => {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], () => (root.Humanize = factory()));
  } else {
    root.Humanize = factory();
  }
})(this, () => {
  //------------------------------------------------------------------------------
  // Constants
  //------------------------------------------------------------------------------

  const TIME_FORMATS = [
    {
      name: 'second',
      value: 1e3
    },
    {
      name: 'minute',
      value: 6e4
    },
    {
      name: 'hour',
      value: 36e5
    },
    {
      name: 'day',
      value: 864e5
    },
    {
      name: 'week',
      value: 6048e5
    }
  ];

  const LABELS_FOR_POWERS_OF_KILO = {
    P: Math.pow(2, 50),
    T: Math.pow(2, 40),
    G: Math.pow(2, 30),
    M: Math.pow(2, 20)
  };

  //------------------------------------------------------------------------------
  // Helpers
  //------------------------------------------------------------------------------

  const exists = maybe => typeof maybe !== 'undefined' && maybe !== null;

  const isNaN = value => value !== value; // eslint-disable-line

  const isFiniteNumber = value => {
    return isFinite(value) && !isNaN(parseFloat(value));
  };

  const isArray = value => {
    const type = Object.prototype.toString.call(value);
    return type === '[object Array]';
  };

  //------------------------------------------------------------------------------
  // Humanize
  //------------------------------------------------------------------------------

  const Humanize = {

    // Converts a large integer to a friendly text representation.
    intword(number, charWidth, decimals = 2) {
      /*
      * This method is deprecated. Please use compactInteger instead.
      * intword will be going away in the next major version.
      */
      return Humanize.compactInteger(number, decimals);
    },

    // Converts an integer into its most compact representation
    compactInteger(input, decimals = 0) {
      decimals = Math.max(decimals, 0);
      const number = parseInt(input, 10);
      const signString = number < 0 ? '-' : '';
      const unsignedNumber = Math.abs(number);
      const unsignedNumberString = String(unsignedNumber);
      const numberLength = unsignedNumberString.length;
      const numberLengths = [13, 10, 7, 4];
      const bigNumPrefixes = ['T', 'B', 'M', 'k'];

      // small numbers
      if (unsignedNumber < 1000) {
        return `${ signString }${ unsignedNumberString }`;
      }

      // really big numbers
      if (numberLength > numberLengths[0] + 3) {
        return number.toExponential(decimals).replace('e+', 'x10^');
      }

      // 999 < unsignedNumber < 999,999,999,999,999
      let length;
      for (let i = 0; i < numberLengths.length; i++) {
        const _length = numberLengths[i];
        if (numberLength >= _length) {
          length = _length;
          break;
        }
      }

      const decimalIndex = numberLength - length + 1;
      const unsignedNumberCharacterArray = unsignedNumberString.split('');

      const wholePartArray = unsignedNumberCharacterArray.slice(0, decimalIndex);
      const decimalPartArray = unsignedNumberCharacterArray.slice(decimalIndex, decimalIndex + decimals + 1);

      const wholePart = wholePartArray.join('');

      // pad decimalPart if necessary
      let decimalPart = decimalPartArray.join('');
      if (decimalPart.length < decimals) {
        decimalPart += `${ Array(decimals - decimalPart.length + 1).join('0') }`;
      }

      let output;
      if (decimals === 0) {
        output = `${ signString }${ wholePart }${ bigNumPrefixes[numberLengths.indexOf(length)] }`;
      } else {
        const outputNumber = Number(`${ wholePart }.${ decimalPart }`).toFixed(decimals);
        output = `${ signString }${ outputNumber }${ bigNumPrefixes[numberLengths.indexOf(length)] }`;
      }

      return output;
    },

    // Converts an integer to a string containing commas every three digits.
    intComma(number, decimals = 0) {
      return Humanize.formatNumber(number, decimals);
    },

    intcomma(...args) {
      return Humanize.intComma(...args);
    },

    // Formats the value like a 'human-readable' file size (i.e. '13 KB', '4.1 MB', '102 bytes', etc).
    fileSize(filesize, precision = 2) {
      for (const label in LABELS_FOR_POWERS_OF_KILO) {
        if (LABELS_FOR_POWERS_OF_KILO.hasOwnProperty(label)) {
          const minnum = LABELS_FOR_POWERS_OF_KILO[label];
          if (filesize >= minnum) {
            return `${Humanize.formatNumber(filesize / minnum, precision, '')} ${label}B`;
          }
        }
      }
      if (filesize >= 1024) {
        return `${Humanize.formatNumber(filesize / 1024, 0)} KB`;
      }

      return Humanize.formatNumber(filesize, 0) + Humanize.pluralize(filesize, ' byte');
    },

    filesize(...args) {
      return Humanize.fileSize(...args);
    },

    // Formats a number to a human-readable string.
    // Localize by overriding the precision, thousand and decimal arguments.
    formatNumber(number, precision = 0, thousand = ',', decimal = '.') {
      // Create some private utility functions to make the computational
      // code that follows much easier to read.
      const firstComma = (_number, _thousand, _position) => {
        return _position ? _number.substr(0, _position) + _thousand : '';
      };

      const commas = (_number, _thousand, _position) => {
        return _number.substr(_position).replace(/(\d{3})(?=\d)/g, `$1${_thousand}`);
      };

      const decimals = (_number, _decimal, usePrecision) => {
        return usePrecision
          ? _decimal + Humanize.toFixed(Math.abs(_number), usePrecision).split('.')[1]
          : '';
      };

      const usePrecision = Humanize.normalizePrecision(precision);

      // Do some calc
      const negative = number < 0 && '-' || '';
      const base = String(parseInt(Humanize.toFixed(Math.abs(number || 0), usePrecision), 10));
      const mod = base.length > 3 ? base.length % 3 : 0;

      // Format the number
      return (
        negative +
        firstComma(base, thousand, mod) +
        commas(base, thousand, mod) +
        decimals(number, decimal, usePrecision)
      );
    },

    // Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61')
    toFixed(value, precision) {
      precision = exists(precision) ? precision : Humanize.normalizePrecision(precision, 0);
      const power = Math.pow(10, precision);

      // Multiply up by precision, round accurately, then divide and use native toFixed()
      return (Math.round(value * power) / power).toFixed(precision);
    },

    // Ensures precision value is a positive integer
    normalizePrecision(value, base) {
      value = Math.round(Math.abs(value));
      return isNaN(value) ? base : value;
    },

    // Converts an integer to its ordinal as a string.
    ordinal(value) {
      const number = parseInt(value, 10);

      if (number === 0) {
        return value;
      }

      const specialCase = number % 100;
      if ([11, 12, 13].indexOf(specialCase) >= 0) {
        return `${ number }th`;
      }

      const leastSignificant = number % 10;

      let end;
      switch (leastSignificant) {
        case 1:
          end = 'st';
          break;
        case 2:
          end = 'nd';
          break;
        case 3:
          end = 'rd';
          break;
        default:
          end = 'th';
      }

      return `${ number }${ end }`;
    },

    // Interprets numbers as occurences. Also accepts an optional array/map of overrides.
    times(value, overrides = {}) {
      if (isFiniteNumber(value) && value >= 0) {
        const number = parseFloat(value);
        const smallTimes = ['never', 'once', 'twice'];
        if (exists(overrides[number])) {
          return String(overrides[number]);
        }

        const numberString = exists(smallTimes[number]) && smallTimes[number].toString();
        return numberString || `${number.toString()} times`;
      }
      return null;
    },

    // Returns the plural version of a given word if the value is not 1. The default suffix is 's'.
    pluralize(number, singular, plural) {
      if (!(exists(number) && exists(singular))) {
        return null;
      }

      plural = exists(plural) ? plural : `${singular}s`;

      return parseInt(number, 10) === 1 ? singular : plural;
    },

    // Truncates a string if it is longer than the specified number of characters (inclusive).
    // Truncated strings will end with a translatable ellipsis sequence ("…").
    truncate(str, length = 100, ending = '...') {
      if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
      }
      return str;
    },

    // Truncates a string after a certain number of words.
    truncateWords(string, length) {
      const array = string.split(' ');
      let result = '';
      let i = 0;

      while (i < length) {
        if (exists(array[i])) {
          result += `${array[i]} `;
        }
        i++;
      }

      if (array.length > length) {
        return `${result}...`;
      }

      return null;
    },

    truncatewords(...args) {
      return Humanize.truncateWords(...args);
    },

    // Truncates a number to an upper bound.
    boundedNumber(num, bound = 100, ending = '+') {
      let result;

      if (isFiniteNumber(num) && isFiniteNumber(bound)) {
        if (num > bound) {
          result = bound + ending;
        }
      }

      return (result || num).toString();
    },

    truncatenumber(...args) {
      return Humanize.boundedNumber(...args);
    },

    // Converts a list of items to a human readable string with an optional limit.
    oxford(items, limit, limitStr) {
      const numItems = items.length;

      let limitIndex;
      if (numItems < 2) {
        return String(items);
      } else if (numItems === 2) {
        return items.join(' and ');
      } else if (exists(limit) && numItems > limit) {
        const extra = numItems - limit;
        limitIndex = limit;
        limitStr = exists(limitStr) ? limitStr : `, and ${extra} ${Humanize.pluralize(extra, 'other')}`;
      } else {
        limitIndex = -1;
        limitStr = `, and ${items[numItems - 1]}`;
      }

      return items.slice(0, limitIndex).join(', ') + limitStr;
    },

    // Converts an object to a definition-like string
    dictionary(object, joiner = ' is ', separator = ', ') {
      const result = '';

      if (exists(object) && typeof object === 'object' && !isArray(object)) {
        const defs = [];
        for (const key in object) {
          if (object.hasOwnProperty(key)) {
            const val = object[key];
            defs.push(`${ key }${ joiner }${ val }`);
          }
        }

        return defs.join(separator);
      }

      return result;
    },

    // Describes how many times an item appears in a list
    frequency(list, verb) {
      if (!isArray(list)) {
        return null;
      }

      const len = list.length;
      const times = Humanize.times(len);

      if (len === 0) {
        return `${times} ${verb}`;
      }

      return `${verb} ${times}`;
    },

    pace(value, intervalMs, unit = 'time') {
      if (value === 0 || intervalMs === 0) {
        // Needs a better string than this...
        return `No ${Humanize.pluralize(0, unit)}`;
      }

      // Expose these as overridables?
      let prefix = 'Approximately';
      let timeUnit;
      let relativePace;

      const rate = value / intervalMs;
      for (let i = 0; i < TIME_FORMATS.length; ++i) { // assumes sorted list
        const f = TIME_FORMATS[i];
        relativePace = rate * f.value;
        if (relativePace > 1) {
          timeUnit = f.name;
          break;
        }
      }

      // Use the last time unit if there is nothing smaller
      if (!timeUnit) {
        prefix = 'Less than';
        relativePace = 1;
        timeUnit = TIME_FORMATS[TIME_FORMATS.length - 1].name;
      }

      const roundedPace = Math.round(relativePace);
      unit = Humanize.pluralize(roundedPace, unit);

      return `${prefix} ${roundedPace} ${unit} per ${timeUnit}`;
    },

    // Converts newlines to <br/> tags
    nl2br(string, replacement = '<br/>') {
      return string.replace(/\n/g, replacement);
    },

    // Converts <br/> tags to newlines
    br2nl(string, replacement = '\r\n') {
      return string.replace(/\<br\s*\/?\>/g, replacement);
    },

    // Capitalizes first letter in a string
    capitalize(string, downCaseTail = false) {
      return `${ string.charAt(0).toUpperCase() }${ downCaseTail ? string.slice(1).toLowerCase() : string.slice(1) }`;
    },

    // Capitalizes the first letter of each word in a string
    capitalizeAll(string) {
      return string.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    },

    // Titlecase words in a string.
    titleCase(string) {
      const smallWords = /\b(a|an|and|at|but|by|de|en|for|if|in|of|on|or|the|to|via|vs?\.?)\b/i;
      const internalCaps = /\S+[A-Z]+\S*/;
      const splitOnWhiteSpaceRegex = /\s+/;
      const splitOnHyphensRegex = /-/;

      let doTitleCase;
      doTitleCase = (_string, hyphenated = false, firstOrLast = true) => {
        const titleCasedArray = [];
        const stringArray = _string.split(hyphenated ? splitOnHyphensRegex : splitOnWhiteSpaceRegex);

        for (let index = 0; index < stringArray.length; ++index) {
          const word = stringArray[index];
          if (word.indexOf('-') !== -1) {
            titleCasedArray.push(doTitleCase(word, true, (index === 0 || index === stringArray.length - 1)));
            continue;
          }

          if (firstOrLast && (index === 0 || index === stringArray.length - 1)) {
            titleCasedArray.push(internalCaps.test(word) ? word : Humanize.capitalize(word));
            continue;
          }

          if (internalCaps.test(word)) {
            titleCasedArray.push(word);
          } else if (smallWords.test(word)) {
            titleCasedArray.push(word.toLowerCase());
          } else {
            titleCasedArray.push(Humanize.capitalize(word));
          }
        }

        return titleCasedArray.join(hyphenated ? '-' : ' ');
      };

      return doTitleCase(string);
    },

    titlecase(...args) {
      return Humanize.titleCase(...args);
    }
  };

  return Humanize;
});
