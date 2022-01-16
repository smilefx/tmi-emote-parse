(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],2:[function(require,module,exports){
(function (global){(function (){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
if (global.fetch) {
	exports.default = global.fetch.bind(global);
}

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
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
    // console.log(args);

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

var emoteParse = {
  loadAssets: loadAssets
};

module.exports = emoteParse;
console.log("Test")

exports.events = new ParseEmitter();
},{"events":1,"node-fetch":2}]},{},[3]);
