var fetch = require("node-fetch");
const EventEmitter = require('events');

class ParseEmitter extends EventEmitter {}

var loadedAssets = {};

function loadAssets(channel, args) {

    loadedAssets[channel] = {
        channel: channel,
        uid: "",
        emotes: [],
        badges: {},
        badgesLoaded: [false, false, false],
        allLoaded: false,
        loaded: {
            bttv: {
                global: false,
                channel: false
            },
            ffz: {
                global: false,
                channel: false
            },
            "7tv": {
                global: false,
                channel: false
            }
        }
    }

    fetch(`https://dadoschyt.de/api/tmt/user/${channel}`)
        .then(response => response.json())
        .then(body => {
            try {
                var uid = body.users[0]._id;

            } catch (error) {
                exports.events.emit('error', {
                    channel: channel,
                    error: "Failed to load user information for " + channel
                });
            } finally {
                loadedAssets[channel].uid = uid;
                loadConcurrent(uid, channel, args);
            }
        });
}

function loadConcurrent(uid, channel, args) {

    // NOTE: FFZ

    if (args["ffz"]["channel"] == true) {
        fetch(`https://api.frankerfacez.com/v1/room/${channel}`)
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

                    checkLoadedAll(channel, "ffz", "channel", true, args);
                    if (loadedAssets[channel].allLoaded) {
                        loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                        exports.events.emit('emotes', {
                            channel: channel
                        });

                        if (loadedAssets[channel].badgesLoaded[2]) {
                            exports.events.emit('loaded', {
                                channel: channel
                            });
                        }
                    }

                } catch (error) {
                    //console.log(error);
                    exports.events.emit('error', {
                        channel: channel,
                        error: "Failed to load FFZ channel emotes for " + channel
                    });
                }
            });
    } else {
        checkLoadedAll(channel, "ffz", "channel", null, args);
    }

    if (args["ffz"]["global"] == true) {
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

                    checkLoadedAll(channel, "ffz", "global", true, args);
                    if (loadedAssets[channel].allLoaded) {
                        loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                        exports.events.emit('emotes', {
                            channel: channel
                        });

                        if (loadedAssets[channel].badgesLoaded[2]) {
                            exports.events.emit('loaded', {
                                channel: channel
                            });
                        }
                    }
                } catch (error) {
                    //console.log(error);
                    exports.events.emit('error', {
                        channel: channel,
                        error: "Failed to load FFZ global emotes for " + channel
                    });
                }

            });
    } else {
        checkLoadedAll(channel, "ffz", "global", null, args);
    }


    // NOTE: BTTV

    if (args["bttv"]["channel"] == true) {
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

                    checkLoadedAll(channel, "bttv", "channel", true, args);
                    if (loadedAssets[channel].allLoaded) {
                        loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                        exports.events.emit('emotes', {
                            channel: channel
                        });

                        if (loadedAssets[channel].badgesLoaded[2]) {
                            exports.events.emit('loaded', {
                                channel: channel
                            });
                        }
                    }
                } catch (error) {
                    //console.log(error);
                    exports.events.emit('error', {
                        channel: channel,
                        error: "Failed to load BetterTTV channel emotes for " + channel
                    });
                }
            });
    } else {
        checkLoadedAll(channel, "bttv", "channel", null, args);
    }

    if (args["bttv"]["global"] == true) {
        fetch(`https://api.betterttv.net/3/cached/emotes/global`)
            .then(response => response.json())
            .then(body => {
                try {
                    body.forEach(ele => {
                        ele.type = "bttv";
                        loadedAssets[channel].emotes.push(ele);
                    })

                    checkLoadedAll(channel, "bttv", "global", true, args);
                    if (loadedAssets[channel].allLoaded) {
                        loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                        exports.events.emit('emotes', {
                            channel: channel
                        });

                        if (loadedAssets[channel].badgesLoaded[2]) {
                            exports.events.emit('loaded', {
                                channel: channel
                            });
                        }
                    }
                } catch (error) {
                    //console.log(error);
                    exports.events.emit('error', {
                        channel: channel,
                        error: "Failed to load BetterTTV global emotes for " + channel
                    });
                }
            });
    } else {
        checkLoadedAll(channel, "bttv", "global", null, args);
    }

    // NOTE: 7TV

    if (args["7tv"]["channel"] == true || args["7tv"]["global"] == true) {
        fetch(`https://api.7tv.app/v2/users/${channel}`)
            .then(response => response.json())
            .then(body => {
                try {
                    if (body.Status == undefined && body.Status != 404) {
                        if (args["7tv"]["channel"] == true) {
                            fetch(`https://api.7tv.app/v2/users/${channel}/emotes`)
                                .then(response => response.json())
                                .then(body => {
                                    try {
                                        if (body.Status == undefined && body.Status != 404) {
                                            body.forEach(ele => {
                                                ele.code = ele.name;
                                                ele.type = "7tv";
                                                loadedAssets[channel].emotes.push(ele);
                                            })

                                            checkLoadedAll(channel, "7tv", "channel", true, args);
                                            if (loadedAssets[channel].allLoaded) {
                                                loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                                                exports.events.emit('emotes', {
                                                    channel: channel
                                                });

                                                if (loadedAssets[channel].badgesLoaded[2]) {
                                                    exports.events.emit('loaded', {
                                                        channel: channel
                                                    });
                                                }
                                            }
                                        } else {
                                            exports.events.emit('error', {
                                                channel: channel,
                                                error: "Failed to load 7TV global emotes for " + channel
                                            });

                                            checkLoadedAll(channel, "7tv", "channel", true, args);
                                        }
                                    } catch (error) {
                                        //console.log(error);
                                        exports.events.emit('error', {
                                            channel: channel,
                                            error: "Failed to load 7TV global emotes for " + channel
                                        });
                                    }
                                });
                        } else {
                            checkLoadedAll(channel, "7tv", "channel", null, args);
                        }

                        if (args["7tv"]["global"] == true) {
                            fetch(`https://api.7tv.app/v2/emotes/global`)
                                .then(response => response.json())
                                .then(body => {
                                    try {
                                        body.forEach(ele => {
                                            ele.code = ele.name;
                                            ele.type = "7tv";
                                            loadedAssets[channel].emotes.push(ele);
                                        })

                                        checkLoadedAll(channel, "7tv", "global", true, args);
                                        if (loadedAssets[channel].allLoaded) {
                                            loadedAssets[channel].emotes = loadedAssets[channel].emotes.sort(compareLength);
                                            exports.events.emit('emotes', {
                                                channel: channel
                                            });

                                            if (loadedAssets[channel].badgesLoaded[2]) {
                                                exports.events.emit('loaded', {
                                                    channel: channel
                                                });
                                            }
                                        }
                                    } catch (error) {
                                        //console.log(error);
                                        exports.events.emit('error', {
                                            channel: channel,
                                            error: "Failed to load 7TV channel emotes for " + channel
                                        });
                                    }
                                });
                        } else {
                            checkLoadedAll(channel, "7tv", "global", null, args);
                        }
                    } else {
                        exports.events.emit('error', {
                            channel: channel,
                            error: "No 7TV user available for " + channel
                        });

                        checkLoadedAll(channel, "7tv", "channel", true, args);
                        checkLoadedAll(channel, "7tv", "global", true, args);
                    }
                } catch (error) {
                    exports.events.emit('error', {
                        channel: channel,
                        error: "Failed to load 7TV global emotes for " + channel
                    });
                }
            });
    } else {
        checkLoadedAll(channel, "7tv", "channel", null, args);
    }

    // NOTE: Twitch Badges

    fetch(`https://badges.twitch.tv/v1/badges/global/display`)
        .then(response => response.json())
        .then(body => {
            try {
                Object.keys(body.badge_sets).forEach((ele, ind) => {
                    Object.keys(body.badge_sets[ele].versions).forEach((el, i) => {
                        if (loadedAssets[channel].badges[ele + "/" + el] == undefined) {
                            loadedAssets[channel].badges[ele + "/" + el] = {
                                name: ele + "/" + el,
                                info: body.badge_sets[ele].versions[el].title,
                                img: body.badge_sets[ele].versions[el].image_url_4x
                            }
                        }
                    })
                })
                loadedAssets[channel].badgesLoaded[0] = true;
                if (loadedAssets[channel].badgesLoaded.indexOf(false) == 2) {
                    loadedAssets[channel].badgesLoaded[2] = true;
                    exports.events.emit('badges', {
                        channel: channel
                    });
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[6] == true) {
                        exports.events.emit('loaded', {
                            channel: channel
                        });
                    }
                }
            } catch (error) {
                exports.events.emit('error', {
                    channel: channel,
                    error: "Failed to load global badges for " + channel
                });
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
                    exports.events.emit('badges', {
                        channel: channel
                    });
                    if (loadedAssets[channel].badgesLoaded[2] == true && loadedAssets[channel].loaded[6] == true) {
                        exports.events.emit('loaded', {
                            channel: channel
                        });
                    }
                }
            } catch (error) {
                exports.events.emit('error', {
                    channel: channel,
                    error: "Failed to load channel badges for " + channel
                });
            }
        });
}

function checkLoaded(channel) {
    if (loadedAssets[channel].loaded[6]) {
        return 2;
    } else if (loadedAssets[channel].loaded[0] && loadedAssets[channel].loaded[1] && loadedAssets[channel].loaded[2] && loadedAssets[channel].loaded[3] && loadedAssets[channel].loaded[4] && loadedAssets[channel].loaded[5] && !loadedAssets[channel].loaded[6]) {
        return 1;
    } else if (!loadedAssets[channel].loaded[0] || !loadedAssets[channel].loaded[1] || !loadedAssets[channel].loaded[2] || !loadedAssets[channel].loaded[3] || !loadedAssets[channel].loaded[4] || !loadedAssets[channel].loaded[5]) {
        return 0;
    }
}

function checkLoadedAll(channel, type, extra, value, args) {
    if (args[type][extra] == false && value == null) {
        loadedAssets[channel].loaded[type][extra] = null;
        // console.log(`Skipped ${channel}: ${type} - ${extra}`);
    }
    if (args[type][extra] == true && loadedAssets[channel].loaded[type][extra] == false && value == true) {
        loadedAssets[channel].loaded[type][extra] = true;
        // console.log(`Loaded ${channel}: ${type} - ${extra}`);
    }

    var trueVals = [];
    Object.keys(loadedAssets[channel].loaded).forEach((e, ind) => {
        e = loadedAssets[channel].loaded[e];
        var allTrue = true;
        Object.keys(e).forEach(ele => {
            ele = e[ele];
            if (ele == false) {
                allTrue = false;
            }
        })

        trueVals.push(allTrue);
    });

    loadedAssets[channel].allLoaded = !trueVals.includes(false);
    return !trueVals.includes(false);

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

    return message;
}

function getMessageEmotes(message, tags, channel) {

    var emotes = [];
    var gotEmotes = [];
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
            var code = message.substring(ele.start, ele.end + 1);
            var found = false;
            gotEmotes.forEach(el => {
                if (el.code == code) {
                    found = true;
                    // el.count++;
                }
            })
            if (!found) gotEmotes.push({
                code: code,
                img: `https://static-cdn.jtvnw.net/emoticons/v2/${ele.rep}/default/dark/3.0`,
                type: "twitch",
                // count: 1
            })
            message = message.replaceAt(ele.start, ele.end, ele.rep);
        });
    }

    var fEmotes = replaceBTTVAll(message, channel);

    fEmotes.forEach(ele => {
        var found = false;
        gotEmotes.forEach(el => {
            if (el.code == ele.code) {
                found = true;
                // el.count++;
            }
        })
        if (!found) gotEmotes.push(ele)
    })

    message = message.replace(//gm, "&lt;").replace(//g, "&gt;");

    return gotEmotes;
}

String.prototype.replaceAt = function (start, end, replacement) {
    var cur = this.substring(start, end + 1);
    var emRep = `<img class="message-emote"src="https://static-cdn.jtvnw.net/emoticons/v2/${replacement}/default/dark/3.0"/>`;
    return this.substring(0, start) + emRep + this.substring(end + 1, this.length);
}

function replaceBTTVAll(msg, channel) {
    var gotEmotes = [];
    loadedAssets[channel].emotes.forEach(ele => {

        var regex = new RegExp("(^" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "$|\\s" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "\\s)", "gm");

        if (ele.type == "bttv") {
            var m = msg.match(regex);
            msg = msg.replace(regex, `<img class="message-emote"src="https://cdn.betterttv.net/emote/${ele.id}/3x"/>`)

            if (m != null && m.length > 0) {
                var found = false;
                gotEmotes.forEach(el => {
                    if (el.code == ele.code) {
                        found = true;
                        // el.count++;
                    }
                })
                if (!found) gotEmotes.push({
                    code: ele.code,
                    img: `https://cdn.betterttv.net/emote/${ele.id}/3x`,
                    type: "bttv",
                    // count: 1
                })
            }
        } else if (ele.type == "ffz") {
            var m = msg.match(regex);
            var poss = ele.urls[4] != undefined ? ele.urls[4] : ele.urls[2] != undefined ? ele.urls[2] : ele.urls[1];
            msg = msg.replace(regex, `<img class="message-emote"src="https:${poss}"/>`)

            if (m != null && m.length > 0) {
                var found = false;
                gotEmotes.forEach(el => {
                    if (el.code == ele.code) {
                        found = true;
                        // el.count++;
                    }
                })
                if (!found) gotEmotes.push({
                    code: ele.code,
                    img: `https:${poss}`,
                    type: "ffz",
                    // count: 1
                })
            }
        } else if (ele.type == "7tv") {
            var m = msg.match(regex);
            var poss = ele.urls[3][1] != undefined ? ele.urls[3][1] : ele.urls[2][1] != undefined ? ele.urls[2][1] : ele.urls[1][1];
            msg = msg.replace(regex, `<img class="message-emote"src="${poss}"/>`)

            if (m != null && m.length > 0) {
                var found = false;
                gotEmotes.forEach(el => {
                    if (el.code == ele.code) {
                        found = true;
                        // el.count++;
                    }
                })
                if (!found) gotEmotes.push({
                    code: ele.code,
                    img: poss,
                    type: "7tv",
                    // count: 1
                })
            }
        }
    })
    return gotEmotes;
}

function replaceBTTV(msg, channel) {
    if (loadedAssets[channel] == undefined) {
        exports.events.emit('error', {
            channel: channel,
            error: "The channel " + channel + " has not been loaded yet"
        });
    } else {
        loadedAssets[channel].emotes.forEach(ele => {

            var regex = new RegExp("(^" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "$|\\s" + ele.code + "(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])|(?=[^\?\!\.\"\_\*\+\#\'\´\`\\\/\%\&\$\€\§\=])" + ele.code + "\\s)", "gm");

            if (ele.type == "bttv") {
                msg = msg.replace(regex, `<img class="message-emote"src="https://cdn.betterttv.net/emote/${ele.id}/3x"/>`)
            } else if (ele.type == "ffz") {
                var poss = ele.urls[4] != undefined ? ele.urls[4] : ele.urls[2] != undefined ? ele.urls[2] : ele.urls[1];
                msg = msg.replace(regex, `<img class="message-emote"src="https:${poss}"/>`)
            } else if (ele.type == "7tv") {
                var poss = ele.urls[3][1] != undefined ? ele.urls[3][1] : ele.urls[2][1] != undefined ? ele.urls[2][1] : ele.urls[1][1];
                msg = msg.replace(regex, `<img class="message-emote"src="${poss}"/>`)
            }
        })
    }
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

function loadOptions(args) {
    if (args == undefined) {
        args = {
            bttv: {
                global: true,
                channel: true
            },
            ffz: {
                global: true,
                channel: true
            },
            "7tv": {
                global: true,
                channel: true
            }
        }
    } else {
        if (args["bttv"] == undefined || args["bttv"] == false) {
            args["bttv"] = {
                global: false,
                channel: false
            }
        } else if (args["bttv"] == true) {
            args["bttv"] = {
                global: true,
                channel: true
            }
        } else {
            if (args["bttv"]["global"] == undefined) {
                args["bttv"]["global"] = false;
            }
            if (args["bttv"]["channel"] == undefined) {
                args["bttv"]["channel"] = false;
            }
        }

        if (args["ffz"] == undefined || args["ffz"] == false) {
            args["ffz"] = {
                global: false,
                channel: false
            }
        } else if (args["ffz"] == true) {
            args["ffz"] = {
                global: true,
                channel: true
            }
        } else {
            if (args["ffz"]["global"] == undefined) {
                args["ffz"]["global"] = false;
            }
            if (args["ffz"]["channel"] == undefined) {
                args["ffz"]["channel"] = false;
            }
        }

        if (args["7tv"] == undefined || args["7tv"] == false) {
            args["7tv"] = {
                global: false,
                channel: false
            }
        } else if (args["7tv"] == true) {
            args["7tv"] = {
                global: true,
                channel: true
            }
        } else {
            if (args["7tv"]["global"] == undefined) {
                args["7tv"]["global"] = false;
            }
            if (args["7tv"]["channel"] == undefined) {
                args["7tv"]["channel"] = false;
            }
        }
    }
    return args;
}

exports.loadAssets = function (channel, args) {
    args = loadOptions(args);
    loadAssets(channel.replace("#", "").trim().toLowerCase(), args);
}

exports.getLoaded = function (channel) {
    if (channel == undefined) {
        var loaded = {};
        Object.keys(loadedAssets).forEach(el => {
            loaded[el] = {};
            var ele = loadedAssets[el];
            loaded[el].channel = el;
            loaded[el].emotes = ele.allLoaded;
            loaded[el].badges = !ele.badgesLoaded.includes(false);
        })
        return loaded;
    } else {
        channel = channel.replace("#", "").trim().toLowerCase();
        var loaded = {

        };
        var found = false;
        Object.keys(loadedAssets).forEach(el => {
            if (el == channel) {
                found = true;
                loaded[el] = {};
                var ele = loadedAssets[el];
                loaded[el].channel = el;
                loaded[el].emotes = ele.allLoaded;
                loaded[el].badges = !ele.badgesLoaded.includes(false);
            }
        })
        if (found == false) loaded[channel] = null;
        return loaded;
    }
}

exports.getEmotes = function (message, tags, channel) {
    return getMessageEmotes(message, tags, channel.replace("#", "").trim().toLowerCase());
}

exports.replaceEmotes = function (message, tags, channel) {
    return replaceMessage(message, tags, channel.replace("#", "").trim().toLowerCase());
}

exports.getBadges = function (tags, channel) {
    return getBadges(tags, channel.replace("#", "").trim().toLowerCase());
}

exports.getAllBadges = function (channel) {
    channel = channel.replace("#", "").trim().toLowerCase();
    if (loadedAssets[channel] != undefined) {
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
    if (loadedAssets[channel] != undefined) {
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
            } else if (ele.type == "7tv") {
                var poss = ele.urls[3][1] != undefined ? ele.urls[3][1] : ele.urls[2][1] != undefined ? ele.urls[2][1] : ele.urls[1][1];
                var obj = {
                    name: ele.code,
                    type: "7tv",
                    img: `${poss}`
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