var fetch = require("node-fetch");
const EventEmitter = require('events');

class ParseEmitter extends EventEmitter {}

var loadedAssets = {};

function loadAssets(channel) {

    loadedAssets[channel] = {
        channel: channel,
        uid: "",
        emotes: [],
        badges: {},
        badgesLoaded: [false, false, false],
        loaded: [false, false, false, false, false]
    }

    fetch(`https://dadoschyt.de/api/tmt/user/${channel}`)
        .then(response => response.json())
        .then(body => {
            console.log(body);
            try {
                var uid = body.users[0]._id;
                loadedAssets[channel].uid = uid;
                loadConcurrent(uid, channel);
                
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load user information for " + channel});
            }
        });
}

function loadConcurrent(uid, channel) {

    fetch(`https://api.frankerfacez.com/v1/room/${channel}`)
        .then(response => response.json())
        .then(body => {
            console.log(body);
            try {
                Object.keys(body.sets).forEach(el => {
                    var e = body.sets[el];

                    e.emoticons.forEach(ele => {
                        ele.code = ele.name;
                        ele.type = "ffz";
                        loadedAssets[channel].emotes.push(ele);
                    })
                })

                loadedAssets[channel].loaded[2] = true;
                if (checkLoaded(channel) == 1) {
                    loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                    loadedAssets[channel].loaded[4] = true;
                    exports.events.emit('emotes', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load FFZ channel emotes for " + channel});
            }
        });

    fetch(`https://api.betterttv.net/3/cached/users/twitch/${uid}`)
        .then(response => response.json())
        .then(body => {
            try {
                body.channelEmotes.forEach(ele => {
                    ele.type = "bttv";
                    loadedAssets[channel].emotes.push(ele);
                })

                body.sharedEmotes.forEach(ele => {
                    ele.type = "bttv";
                    loadedAssets[channel].emotes.push(ele);
                })

                loadedAssets[channel].loaded[1] = true;
                if (checkLoaded(channel) == 1) {
                    loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                    loadedAssets[channel].loaded[4] = true;
                    exports.events.emit('emotes', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load BetterTTV channel emotes for " + channel});
            }
        });

    fetch(`https://api.betterttv.net/3/cached/emotes/global`)
        .then(response => response.json())
        .then(body => {
            try {
                body.forEach(ele => {
                    ele.type = "bttv";
                    loadedAssets[channel].emotes.push(ele);
                })

                loadedAssets[channel].loaded[0] = true;
                if (checkLoaded(channel) == 1) {
                    loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                    loadedAssets[channel].loaded[4] = true;
                    exports.events.emit('emotes', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load BetterTTV global emotes for " + channel});
            }
        });

    fetch(`https://api.frankerfacez.com/v1/set/global`)
        .then(response => response.json())
        .then(body => {
            try {
                Object.keys(body.sets).forEach(el => {
                    var e = body.sets[el];

                    e.emoticons.forEach(ele => {
                        ele.code = ele.name;
                        ele.type = "ffz";
                        loadedAssets[channel].emotes.push(ele);
                    })
                })

                loadedAssets[channel].loaded[3] = true;
                if (checkLoaded(channel) == 1) {
                    loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                    loadedAssets[channel].loaded[4] = true;
                    exports.events.emit('emotes', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load FFZ global emotes for " + channel});
            }
            
        });

    fetch(`https://badges.twitch.tv/v1/badges/global/display`)
        .then(response => response.json())
        .then(body => {
            try {
                Object.keys(body.badge_sets).forEach((ele, ind) => {
                    Object.keys(body.badge_sets[ele].versions).forEach((el, i) => {
                        loadedAssets[channel].badges[ele + "/" + el] = {
                            name: ele + "/" + el,
                            info: body.badge_sets[ele].versions[el].title,
                            img: body.badge_sets[ele].versions[el].image_url_4x
                        }
                    })
                })
                loadedAssets[channel].badgesLoaded[0] = true;
                if (loadedAssets[channel].badgesLoaded.indexOf(false) == 2) {
                    loadedAssets[channel].badgesLoaded[2] = true;
                    exports.events.emit('badges', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load global badges for " + channel});
            }
        });

    fetch(`https://badges.twitch.tv/v1/badges/channels/${uid}/display`)
        .then(response => response.json())
        .then(body => {
            try {
                Object.keys(body.badge_sets).forEach((ele, ind) => {
                    Object.keys(body.badge_sets[ele].versions).forEach((el, i) => {
                        loadedAssets[channel].badges[ele + "/" + el] = {
                            name: ele + "/" + el,
                            info: body.badge_sets[ele].versions[el].title,
                            img: body.badge_sets[ele].versions[el].image_url_4x
                        }
                    })
                })
                loadedAssets[channel].badgesLoaded[1] = true;
                if (loadedAssets[channel].badgesLoaded.indexOf(false) == 2) {
                    loadedAssets[channel].badgesLoaded[2] = true;
                    exports.events.emit('badges', {channel: channel});
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[4] == true) {
                        exports.events.emit('loaded', {channel: channel});
                    }
                }
            } catch (error) {
                exports.events.emit('error', {channel: channel, error: "Failed to load channel badges for " + channel});
            }
        });
}

function checkLoaded(channel) {
    if (loadedAssets[channel].loaded[4]) {
        return 2;
    } else if (loadedAssets[channel].loaded[0] && loadedAssets[channel].loaded[1] && loadedAssets[channel].loaded[2] && loadedAssets[channel].loaded[3] && !loadedAssets[channel].loaded[4]) {
        return 1;
    } else if (!loadedAssets[channel].loaded[0] || !loadedAssets[channel].loaded[1] || !loadedAssets[channel].loaded[2] || !loadedAssets[channel].loaded[3]) {
        return 0;
    }
}

function compareLength(a, b) {
    if (a.code.length < b.code.length) {
        return 1;
    }
    if (a.code.length > b.code.length) {
        return -1;
    }
    return 0;
}

function compareEnd(a, b) {
    if (a.end < b.end) {
        return -1;
    }
    if (a.end > b.end) {
        return 1;
    }
    return 0;
}

function replaceMessage(message, tags, channel) {
    message = message.replace(/</gm, "");
    message = message.replace(/>/gm, "");

    var emotes = [];
    if (tags.emotes != null) {
        Object.keys(tags.emotes).forEach((el, ind) => {
            var em = tags.emotes[el];
            em.forEach(ele => {
                var start = parseInt(ele.split("-")[0]);
                var end = parseInt(ele.split("-")[1]);
                emotes.push({
                    start: start,
                    end: end,
                    rep: Object.keys(tags.emotes)[ind]
                })
            })
        })

        emotes.sort(compareEnd);
        emotes = emotes.reverse();

        emotes.forEach((ele, ind) => {
            message = message.replaceAt(ele.start, ele.end, ele.rep);
        });
    }
    message = replaceBTTV(message, channel);

    message = message.replace(//gm, "&lt;").replace(//g, "&gt;");
    // var mElems = message.split(/((?<!<img)\s(?!\/>)|(?<=>)(?=<)|(?<=.)(?=<img)|(?<=\/>)(?=.))/gm);
    // mElems.forEach((el, ind) => {
    //     el = el.trim();
    //     if(el == "") {
    //         mElems.splice(ind, 1);
    //     }
    //     //  else {
    //     //     if(el.startsWith("<img")) {
    //     //         mElems[ind] = el.replace(/\"src=/gm, `\" src=`);
    //     //     }
    //     // }
    // })
    // return mElems;
    return message;
}

String.prototype.replaceAt = function (start, end, replacement) {
    var cur = this.substring(start, end + 1);
    var emRep = `<img class="message-emote"src="https://static-cdn.jtvnw.net/emoticons/v2/${replacement}/default/dark/3.0"/>`;
    return this.substring(0, start) + emRep + this.substring(end + 1, this.length);
}

function replaceBTTV(msg, channel) {
    loadedAssets[channel].emotes.forEach(ele => {

        var regex = new RegExp("(^" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "$|\\s" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "\\s)", "gm");

        if (ele.type == "bttv") {
            // var regex = new RegExp("(\\s" + ele.code + "\\s|^" + ele.code + "\\s|\\s" + ele.code + "$)", "gm");
            msg = msg.replace(regex, `<img class="message-emote"src="https://cdn.betterttv.net/emote/${ele.id}/3x"/>`)
        } else if (ele.type == "ffz") {
            var poss = ele.urls[4] != undefined ? ele.urls[4] : ele.urls[2] != undefined ? ele.urls[2] : ele.urls[1];
            // var regex = new RegExp("(\\s" + ele.code + "\\s|^" + ele.code + "\\s|\\s" + ele.code + "$)", "gm");
            msg = msg.replace(regex, `<img class="message-emote"src="https:${poss}"/>`)
        }
    })
    return msg;
}

function getBadges(tags, channel) {
    var badges = [];
    var bg = tags["badges-raw"] != null ? tags["badges-raw"].split(",") : [];
    bg.forEach((ele, ind) => {
        var cur = loadedAssets[channel].badges[ele] != undefined ? loadedAssets[channel].badges[ele] : null;
        if (cur != null) {
            badges.push(cur);
        }
    })
    return badges;
}

exports.loadAssets = function (channel) {
    loadAssets(channel.replace("#", "").trim().toLowerCase());
}

exports.getLoaded = function (channel) {
    if(channel == undefined) {
        var loaded = {};
        Object.keys(loadedAssets).forEach(el => {
            loaded[el] = {};
            var ele = loadedAssets[el];
            loaded[el].channel = el;
            loaded[el].emotes = !ele.loaded.includes(false);
            loaded[el].badges = !ele.badgesLoaded.includes(false);
        })
        return loaded;
    } else {
        channel = channel.replace("#", "").trim().toLowerCase();
        var loaded = {
            
        };
        var found = false;
        Object.keys(loadedAssets).forEach(el => {
            if(el == channel) {
                found = true;
                loaded[el] = {};
                var ele = loadedAssets[el];
                loaded[el].channel = el;
                loaded[el].emotes = !ele.loaded.includes(false);
                loaded[el].badges = !ele.badgesLoaded.includes(false);
            }
        })
        if(found == false) loaded[channel] = null;
        return loaded;
    }
}

exports.replaceEmotes = function (message, tags, channel) {
    return replaceMessage(message, tags, channel.replace("#", "").trim().toLowerCase());
}

exports.getBadges = function (tags, channel) {
    return getBadges(tags, channel.replace("#", "").trim().toLowerCase());
}

exports.getAllBadges = function (channel) {
    channel = channel.replace("#", "").trim().toLowerCase();
    if(loadedAssets[channel] != undefined) {
        var allBadges = [];
        Object.keys(loadedAssets[channel].badges).forEach(el => {
            var ele = loadedAssets[channel].badges[el];
            allBadges.push(ele);
        })
        return allBadges;
    } else {
        return [];
    }
}

exports.getAllEmotes = function (channel) {
    channel = channel.replace("#", "").trim().toLowerCase();
    if(loadedAssets[channel] != undefined) {
        var allEmotes = [];
        loadedAssets[channel].emotes.forEach(ele => {
            if (ele.type == "bttv") {
                var obj = {
                    name: ele.code,
                    type: "bttv",
                    img: `https://cdn.betterttv.net/emote/${ele.id}/3x`
                };
                allEmotes.push(obj);
            } else if (ele.type == "ffz") {
                var poss = ele.urls[4] != undefined ? ele.urls[4] : ele.urls[2] != undefined ? ele.urls[2] : ele.urls[1];
                var obj = {
                    name: ele.code,
                    type: "ffz",
                    img: `https:${poss}`
                };
                allEmotes.push(obj);
            }
        })
        allEmotes.sort(compareEnd);
        // allEmotes = allEmotes.reverse();
        return allEmotes;
    } else {
        return [];
    }
}

exports.events = new ParseEmitter();