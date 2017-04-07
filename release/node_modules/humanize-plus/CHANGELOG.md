### 1.8.2
- Close Humanize in UMD wrapper to prevent global variables

### 1.8.1
- Compress minified file with mangling

### 1.8.0
- Add precision parameter to fileSize [#70]
- Update tests to use source file and not distribution

### 1.7.1
- deprecate node v0.8
- fix undefined recursive function for older node versions

### 1.7.0
- replace coffeescript with ES2016
- UMD wrap library

### 1.6.0
- update build process

### 1.5.0

- fix [#52](https://github.com/HubSpot/humanize/issues/52)
- remove support for node 0.6.x

### 1.4.2

- fix [#41](https://github.com/HubSpot/humanize/issues/41) 

### 1.4.1

- documentation update for npm

### 1.4.0

- add optional `downCaseTail` argument to [Humanize.capitalize](https://github.com/HubSpot/humanize#capitalize)
- add camelCase aliases
   - `intComma`       -> `intcomma`
   - `fileSize`       -> `filesize`
   - `truncateWords`  -> `truncatewords`
   - `boundedNumber`  -> `truncatenumber`
   - `titleCase`      -> `titlecase`

- optimize internal `doTitleCase` method
- remove unused helper methods
- add default arguments for `truncate`

### 1.3.5
- [Release Notes](https://github.com/HubSpot/humanize/tree/master#release-notes) added to README

### 1.3.4
- fix [#33](https://github.com/HubSpot/humanize/issues/33)

### 1.3.3

- fix [#27](https://github.com/HubSpot/humanize/issues/27)

