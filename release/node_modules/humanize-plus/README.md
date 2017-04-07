# Humanize Plus

[![npm version](https://img.shields.io/npm/v/humanize-plus.svg?style=flat-square)](https://www.npmjs.com/package/humanize-plus)
[![build status](https://img.shields.io/travis/HubSpot/humanize/master.svg?style=flat-square)](https://travis-ci.org/HubSpot/humanize)
[![npm downloads](https://img.shields.io/npm/dm/humanize-plus.svg?style=flat-square)](https://www.npmjs.com/package/humanize-plus)


A simple utility library for making the web more humane.

## Getting Started

Humanize Plus is available via node package manager.

`npm install humanize-plus`

Or download the [minified version][min] or the [full version][max].

[min]: https://raw.github.com/HubSpot/humanize/master/dist/humanize.min.js
[max]: https://raw.github.com/HubSpot/humanize/master/src/humanize.js

In your web page:

```html
<script src="public/humanize.min.js"></script>
<script>
var capitalized = Humanize.capitalize("ten tiny ducklings.")
// "Ten tiny ducklings."
</script>
```

In your node package.json:
```javascript
"dependencies": {
  "humanize-plus": "^1.7.0"
}
```

For recent changes, see the [changelog](https://github.com/HubSpot/humanize/blob/master/CHANGELOG.md).

## API Methods

### Numbers

##### formatNumber
Formats a number to a human-readable string. Localize by overriding the precision, thousand and decimal arguments.

```javascript
Humanize.formatNumber(123456789, 2)
// "123,456,789.00"
```

##### intComma
Converts an integer to a string containing commas every three digits.

```javascript
Humanize.intComma(123456789)
// "123,456,789"
```
##### intcomma - DEPRECATED - This method will not be present in the next major version.
Alias for `intComma`


##### intword - DEPRECATED - This method will not be present in the next major version.
Converts a large integer to a friendly text representation.
This method is now a thin wrapper around compactInteger

`Humanize.intword(num, ch, de) === Humanize.compactInteger(num, de)`

```javascript
Humanize.intword(123456789, 'nopnopnopnop', 1)
// "123.5M"

Humanize.intword(123456789, 'this is a nop', 3)
// "123.457M"

Humanize.intword(10, 'still a nop', 1)
// "10"
```

##### compactInteger
Converts an integer into its most compact representation. Decimal precision is ignored for all integers, n, such that abs(n) < 1000.

```javascript
Humanize.compactInteger(123456789, 1)
// "123.5M"

// Switch to scientific notation for trillons, because no one knows those abbreviations.
Humanize.compactInteger(-7832186132456328967, 4)
// "-7.8322x10^18"

Humanize.compactInteger(-100, 2)
// "-100"
```

##### boundedNumber
Bounds a value from above. Modified values have customizable ending strings ('+' by default)

```javascript
Humanize.boundedNumber(110, 100)
// "100+"

Humanize.boundedNumber(50, 100)
// "50"
```

##### truncatenumber - DEPRECATED - This method will not be present in the next major version.
Alias for `boundedNumber`

##### ordinal
Converts an integer to its ordinal as a string.

```javascript
Humanize.ordinal(22)
// "22nd"
```

##### times
Interprets numbers as occurences. Also accepts an optional array/map of overrides.

```javascript
for (i=0; i<5; i++) {
  Humanize.times(i, {"4": "too many"});
  // Bonus!
  if (i === 1) {
    Humanize.times(1.1);
  }
}
// never
// once
// 1.1 times
// twice
// 3 times
// too many times
```

##### pace
Matches a pace (value and interval) with a logical time frame. Very useful for slow paces.

```javascript
second = 1000
week = 6.048e8
decade = 3.156e11

Humanize.pace(1.5, second, "heartbeat")
// Approximately 2 heartbeats per second

Humanize.pace(4, week)
// Approximately 4 times per week

Humanize.pace(1, decade, "life crisis")
// Less than 1 life crisis per week
```

##### fileSize
Formats the value like a 'human-readable' file size (i.e. '13 KB', '4.1 MB', '102 bytes', etc).

```javascript
Humanize.fileSize(1024 * 20)
// "20 Kb"

Humanize.fileSize(1024 * 2000)
// "1.95 Mb"

Humanize.fileSize(Math.pow(1000, 4))
// "931.32 Gb"
```
##### filesize - DEPRECATED - This method will not be present in the next major version.
Alias for `fileSize`


##### pluralize
Returns the plural version of a given word if the value is not 1. The default suffix is 's'.

```javascript
Humanize.pluralize(1, "duck")
// "duck"

Humanize.pluralize(3, "duck")
// "ducks"

Humanize.pluralize(3, "duck", "duckies")
// "duckies"
```

### Strings

##### truncate
Truncates a string if it is longer than the specified number of characters. Truncated strings will end with a translatable ellipsis sequence ("…").

```javascript
Humanize.truncate('long text is good for you')
// "long text is good for you"

Humanize.truncate('long text is good for you', 19)
// "long text is goo..."

Humanize.truncate('long text is good for you', 19, '... etc')
// "long text is... etc"
```

##### truncateWords
Truncates a string after a certain number of words.

```javascript
Humanize.truncateWords('long text is good for you', 5)
// "long text is good for ..."
```

##### truncatewords - DEPRECATED - This method will not be present in the next major version.
Alias for `truncateWords`

##### nl2br and br2nl
Flexible conversion of `<br/>` tags to newlines and vice versa.

```javascript
// Use your imagination
```

##### capitalize
Capitalizes the first letter in a string, optionally downcasing the tail.

```javascript
Humanize.capitalize("some boring string")
// "Some boring string"

Humanize.capitalize("wHoOaA!")
// "WHoOaA!"

Humanize.capitalize("wHoOaA!", true)
// "Whooaa!"
```

##### capitalizeAll
Captializes the first letter of every word in a string.

```javascript
Humanize.capitalizeAll("some boring string")
// "Some Boring String"
```

##### titleCase
Intelligently capitalizes eligible words in a string and normalizes internal whitespace.

```javascript
Humanize.titleCase("some of a boring string")
// "Some of a Boring String"

Humanize.titleCase("cool the          iTunes cake, O'Malley!")
// "Cool the iTunes Cake, O'Malley!"
```

##### titlecase - DEPRECATED - This method will not be present in the next major version.
Alias for `titleCase`


### Arrays

##### oxford
Converts a list of items to a human readable string with an optional limit.

```javascript
items = ['apple', 'orange', 'banana', 'pear', 'pineapple']

Humanize.oxford(items)
// "apple, orange, banana, pear, and pineapple"

Humanize.oxford(items, 3)
// "apple, orange, banana, and 2 others"

// Pluralizes properly too!
Humanize.oxford(items, 4)
// "apple, orange, banana, pear, and 1 other"

Humanize.oxford(items, 3, "and some other fruits")
// "apple, orange, banana, and some other fruits"
```

##### frequency
Describes how many times an item appears in a list

```javascript
aznPics = [
  'http://24.media.tumblr.com/77082543cb69af56ede38a0cdb2511d0/tumblr_mh96olWPLv1r8k4ywo1_1280.jpg',
  'http://25.media.tumblr.com/3e2d318be34d5ef8f86a612cd1d795ff/tumblr_mhbhb96t3z1r8k4ywo1_1280.jpg',
  'http://24.media.tumblr.com/8c5a052e33c27c784514e1b124b383a1/tumblr_mhexaqrk0w1r8k4ywo1_1280.jpg'
]
bigfootPics = []

"Asians " + Humanize.frequency(aznPics, "took pictures of food")
// "Asians took pictures of food 3 times"

"Bigfoot " + Humanize.frequency(bigfootPics, "took pictures of food")
// "Bigfoot never took pictures of food"
```


### Utility methods

##### toFixed
Fixes binary rounding issues (eg. (0.615).toFixed(2) === "0.61").

```javascript
Humanize.toFixed(0.615, 2)
// "0.62"
```

##### normalizePrecision
Ensures precision value is a positive integer.

```javascript
Humanize.normalizePrecision(-232.231)
// 232
```

## Important notes
Please don't edit files in the `dist` subdirectory as they are generated through compilation. You'll find source code in the `src` subdirectory!

## Compiling

`npm run install && npm run build`

And that's it!

The project will compile the CoffeeScript files into the `dist` subdirectory.

## Testing

`npm run test`


## License
Copyright (c) 2013-2016 HubSpotDev
Licensed under the MIT license.
