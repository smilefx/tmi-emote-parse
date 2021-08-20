# tmi-emote-parse
Load and parse Twitch, [BTTV](https://betterttv.com/), [FFZ](https://www.frankerfacez.com/) and [7TV](https://7tv.app/) emotes and badges from messages for multiple channels.

⚠ This module is mainly designed to be integrated in a https://github.com/tmijs/tmi.js environment but can also be used as a standalone with limited features.

<br>

## Table of Contents

- [tmi-emote-parse](#tmi-emote-parse)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Without tmi.js](#without-tmijs)
    - [With tmi.js](#with-tmijs)
  - [Documentation](#documentation)
    - [Functions](#functions)
    - [emoteParser.loadAssets()](#emoteparserloadassets)
    - [emoteParser.getLoaded()](#emoteparsergetloaded)
    - [emoteParser.getAllBadges()](#emoteparsergetallbadges)
    - [emoteParser.getAllEmotes()](#emoteparsergetallemotes)
    - [emoteParser.getEmotes()](#emoteparsergetemotes)
    - [emoteParser.getBadges()](#emoteparsergetbadges)
    - [emoteParser.replaceEmotes()](#emoteparserreplaceemotes)
    - [Events](#events)
    - [Emotes](#emotes)
    - [Badges](#badges)
    - [Loaded](#loaded)
    - [Error](#error)
  - [Community](#community)
  - [Thanks for using the project! 💜](#thanks-for-using-the-project-)
  
<br>

## Installation
Install using npm:
```bash
npm install tmi-emote-parse
```

<br>

## Usage
### Without tmi.js
```js
// 🟦 Require the Module
const emoteParser = require("tmi-emote-parse");

// 🟦 Load emotes and badges for a specific channel to later use
emoteParser.loadAssets("twitch");
emoteParser.loadAssets("twitchdev");

emoteParser.events.on("emotes", (event) => {

    // Get all BTTV & FFZ Emotes used on a channel
    console.log(emoteParser.getAllEmotes(event.channel));
    /* 
        [{
          name: 'KEKW',
          type: 'ffz',
          img: 'https://cdn.frankerfacez.com/emote/381875/4'
        }, ...] 
    */
})

emoteParser.events.on("badges", (event) => {

    // Get all Badges available on a channel
    console.log(emoteParser.getAllBadges(event.channel));
    /* 
        [{
          name: 'bits/1000',
          info: 'cheer 1000',
          img: 'https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3'
        }, ...] 
    */
})
```

### With tmi.js
```js
// 🟦 Require the Module
const emoteParser = require("tmi-emote-parse");

// 🅾 The following part is the tmi.js integration
// (Documentation can be found here: https://github.com/tmijs/tmi.js)
const tmi = require("tmi.js");

client = new tmi.Client({
    options: {
        debug: false
    },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: /* Channel Bot Username */,
        password: /* Channel Bot OAuth */
    },
    channels: [ '#twitch', '#twitchdev' ] /* Channels to join with leading '#' */
});
client.connect().catch(console.error);

// 🅾 tmi.js message event handler (as of tmi.js v1.4.2)
client.on('message', (channel, userstate, message, self) => {

    // 🟦 Use the tmi-emote-parse module here
    // Replace Emotes with HTML in a given message for a specific channel
    console.log(emoteParser.replaceEmotes(channel, userstate, message, self));
    /* 
        -> message: 'I can see you ariW' 
        -> output:  'I can see you <img class="message-emote" src="https://cdn.betterttv.net/emote/56fa09f18eff3b595e93ac26/3x"/>'
    */
    
    // Return the badges the message author uses on a specific channel
    console.log(emoteParser.getBadges(userstate, channel));
    /* 
        [{
          name: 'premium/1',
          info: 'Prime Gaming',
          img: 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3'
        }, ...] 
    */
});

// 🟦 Load emotes and badges for a specific channel to later parse/use
emoteParser.loadAssets("twitch");
emoteParser.loadAssets("twitchdev");
```

<br>

## Documentation
### Functions
### emoteParser.loadAssets()
Load Emotes and Badges of a specific Twitch channel. _(Void)_

**Parameters:**
- `channel`: _String_ - Channel name
- `options`: _Object_ - Load only specific providers [Defaults to loading all] (optional)
  - `options["bttv"]`: _Boolean_ - Load BetterTTV Emotes
  - `options["ffz"]`: _Boolean_ - Load FrankerFaceZ Emotes
  - `options["7tv"]`: _Boolean_ - Load 7TV Emotes
```js
emoteParser.loadAssets("twitch");
emoteParser.loadAssets("twitchdev", { "bttv": true, "ffz": false, "7tv": false });
```

### emoteParser.getLoaded()
Check the loaded status of all channels or one specific channel. _(Object)_

**Parameters:**
- `channel`: _String_ - Channel name (optional)
```js
console.log(emoteParser.getLoaded("twitch"));
```
Returns something like this:
```js
{
  "twitch": { channel: 'twitch', emotes: true, badges: true }
}
```

### emoteParser.getAllBadges()
Return all badges present in the chat for one specific channel. _(Array)_

**Parameters:**
- `channel`: _String_ - Channel name
```js
console.log(emoteParser.getAllBadges("twitch"));
```
Returns something like this:
```js
[{
  name: 'bits/1000',
  info: 'cheer 1000',
  img: 'https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3'
}, ...]
```

### emoteParser.getAllEmotes()
Return all BTTV & FFZ emotes present in the chat for one specific channel. _(Array)_

**Parameters:**
- `channel`: _String_ - Channel name
```js
console.log(emoteParser.getAllEmotes("twitch"));
```
Returns something like this:
```js
[{
  name: 'ariW',
  type: 'bttv',
  img: 'https://cdn.betterttv.net/emote/56fa09f18eff3b595e93ac26/3x'
}, ...]
```

### emoteParser.getEmotes()
⚠ tmi.js only: Return all unique emotes in a single message. _(Array)_

**Parameters:**
- `message`: _String_ - Chat message
- `userstate`: _Object_ - Twitch userstate object (tmi.js)
  - `userstate["badges-raw"]`: _String_ - User badges
  - `...`
- `channel`: _String_ - Channel name
```js
console.log(emoteParser.getEmotes("LUL LUL", userstate, "twitch"));
```
Returns something like this:
```js
[{
  code: 'LUL',
  img: 'https://static-cdn.jtvnw.net/emoticons/v2/425618/default/dark/3.0',
  type: 'twitch'
}]
```

### emoteParser.getBadges()
⚠ tmi.js only: Return all badges a message author uses for one specific channel. _(Array)_

**Parameters:**
- `userstate`: _Object_ - Twitch userstate object (tmi.js)
  - `userstate["badges-raw"]`: _String_ - User badges
  - `...`
- `channel`: _String_ - Channel name
```js
console.log(emoteParser.getBadges(userstate, "twitch"));
```
Returns something like this:
```js
[{
  name: 'bits/1000',
  info: 'cheer 1000',
  img: 'https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3'
}, ...]
```

### emoteParser.replaceEmotes()
⚠ tmi.js only: Parses all legacy Twitch, BTTV and FFZ emotes to HTML in the message for one specific channel. _(String)_

**Parameters:**
- `message`: _String_ - Chat message
- `userstate`: _Object_ - Twitch userstate object (tmi.js)
  - `userstate["emotes"]`: _Object_ - Used emotes in message
  - `...`
- `channel`: _String_ - Channel name
```js
console.log(emoteParser.replaceEmotes("I can see you ariW", userstate, "twitch"));
```
Returns something like this:
```js
'I can see you <img class="message-emote" src="https://cdn.betterttv.net/emote/56fa09f18eff3b595e93ac26/3x"/>'
```

<br>

### Events
### Emotes
Event fires after BTTV & FFZ emotes for any channel have finished loading. _(Object)_

**Parameters:**
- `event`: _Object_ - Event
  - `event.channel`: _String_ - Channel name
```js
emoteParser.events.on("emotes", (event) => {
  console.log(event);
})
```
Returns something like this:
```js
{ channel: 'twitchdev' }
```

### Badges
Event fires after Twitch badges for any channel have finished loading. _(Object)_

**Parameters:**
- `event`: _Object_ - Event
  - `event.channel`: _String_ - Channel name
```js
emoteParser.events.on("badges", (event) => {
  console.log(event);
})
```
Returns something like this:
```js
{ channel: 'twitchdev' }
```

### Loaded
Event fires after all badges and emotes for any channel have finished loading. _(Object)_

**Parameters:**
- `event`: _Object_ - Event
  - `event.channel`: _String_ - Channel name
```js
emoteParser.events.on("loaded", (event) => {
  console.log(event);
})
```
Returns something like this:
```js
{ channel: 'twitchdev' }
```

### Error
Event fires if any error on load occurs for any channel. _(Object)_

**Parameters:**
- `event`: _Object_ - Event
  - `event.channel`: _String_ - Channel name
  - `event.error`: _String_ - Error message
```js
emoteParser.events.on("error", (event) => {
  console.log(event);
})
```
Returns something like this:
```js
{ channel: 'twitchdev', error: 'Failed to load FFZ global emotes for twitchdev' }
```
<br>

## Community
- Follow [@SmileFXOfficial on Twitter](https://twitter.com/SmileFXOfficial), [SmileFXOfficial on Twitch](https://twitch.tv/SmileFXOfficial).
- Found a bug: [Submit an issue](https://github.com/smilefx/tmi-emote-parse/issues).
- Support my work and [buy me a coffee](https://Ko-fi.com/smilefx).
- Discussion and news about tmi-emote-parser: [Join the Discord](https://discord.gg/nV6zP6d4Pq).

## Thanks for using the project! 💜
