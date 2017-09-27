"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const event_emitter_1 = require("./event-emitter");
const slick_di_1 = require("slick-di");
// Cached regex for stripping a leading hash/slash and trailing space.
const routeStripper = /^[#\/]|\s+$/g, 
// Cached regex for stripping leading and trailing slashes.
rootStripper = /^\/+|\/+$/g, 
// Cached regex for removing a trailing slash.
trailingSlash = /\/$/, 
// Cached regex for stripping urls of hash and query.
pathStripper = /[#].*$/;
var HistoryProvider;
(function (HistoryProvider) {
    HistoryProvider[HistoryProvider["Fragment"] = 1] = "Fragment";
    HistoryProvider[HistoryProvider["Push"] = 2] = "Push";
    HistoryProvider[HistoryProvider["Both"] = 3] = "Both";
})(HistoryProvider = exports.HistoryProvider || (exports.HistoryProvider = {}));
class PathChangeEvent {
    constructor(old, value) {
        this.old = old;
        this.value = value;
        this.kind = HistoryProvider.Push;
    }
}
exports.PathChangeEvent = PathChangeEvent;
class FragmentChangeEvent extends PathChangeEvent {
    constructor() {
        super(...arguments);
        this.kind = HistoryProvider.Fragment;
    }
}
exports.FragmentChangeEvent = FragmentChangeEvent;
let HistoryAPI = class HistoryAPI extends event_emitter_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this._started = false;
        this.root = this.options.root || '/';
        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
        this.checkPushUrl = this.checkPushUrl.bind(this);
        this.checkUrlFragment = this.checkUrlFragment.bind(this);
    }
    get started() {
        return this._started;
    }
    get atRoot() {
        return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    }
    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start() {
        if (this.started)
            throw new Error("Router.history has already been started");
        this._started = true;
        // Figure out the initial configuration.
        // Is pushState desired or should we use hashchange only?
        this.root = this.options.root || '/';
        // Normalize root to always include a leading and trailing slash.
        this.root = ('/' + this.root + '/').replace(rootStripper, '/');
        // Depending on whether we're using pushState or hashes, determine how we
        // check the URL state.
        if (this.options.pushState) {
            window.addEventListener('popstate', this.checkPushUrl, false);
        }
        if (this.options.hashChange) {
            window.addEventListener('hashchange', this.checkUrlFragment, false);
        }
        this.checkUrl(HistoryProvider.Both);
    }
    stop() {
        if (!this.started)
            return;
        if (this.options.hashChange)
            window.removeEventListener('hashchange', this.checkUrlFragment);
        if (this.options.pushState)
            window.removeEventListener('popstate', this.checkPushUrl);
        this._started = false;
    }
    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate(kind, part, options) {
        if (!this.started)
            return false;
        if (!options || options === true)
            options = { trigger: !!options };
        var url = this.root + (part = this.getFragment(part || ''));
        // Strip the hash for matching.
        part = part.replace(pathStripper, '');
        switch (kind) {
            case HistoryProvider.Fragment: {
                if (this.fragment == part)
                    return;
                break;
            }
            case HistoryProvider.Push: {
                if (this.path == part)
                    return;
                break;
            }
        }
        // Don't include a trailing slash on the root.
        if (part === '' && url !== '/')
            url = url.slice(0, -1);
        if (kind === HistoryProvider.Push) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
            if (options.trigger)
                this.checkUrl(HistoryProvider.Both);
            else
                this.path = part;
        }
        else if (kind == HistoryProvider.Fragment) {
            this._updateHash(this.location, part, options.replace || false);
            if (options.trigger)
                this.checkUrl(kind);
            else
                this.fragment = part;
        }
        else {
            return this.location.assign(url);
        }
    }
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash(window) {
        var match = (window || this).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    }
    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment(fragment, _ = false) {
        if (typeof fragment === 'string') {
            return fragment.replace(routeStripper, '');
        }
        switch (fragment) {
            case HistoryProvider.Fragment:
                return this.getHash();
            case HistoryProvider.Push: {
                let fragment = decodeURI(this.location.pathname + this.location.search);
                var root = this.root.replace(trailingSlash, '');
                if (!fragment.indexOf(root))
                    fragment = fragment.slice(root.length);
                return fragment;
            }
            default:
                throw new TypeError("fragment should a string or number");
        }
    }
    checkUrlFragment() {
        this.checkUrl(HistoryProvider.Fragment);
    }
    checkPushUrl() {
        this.checkUrl(HistoryProvider.Push);
    }
    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`.
    checkUrl(part) {
        const { Both, Push, Fragment } = HistoryProvider;
        if (~[Both, Fragment].indexOf(part)) {
            const current = this.getFragment(Fragment);
            if (current !== this.fragment /*&& (current == "" && this.fragment != undefined)*/) {
                this.trigger(new FragmentChangeEvent(this.fragment, current));
            }
            this.fragment = current;
        }
        if (~[Both, Push].indexOf(part)) {
            const current = this.getFragment(Push);
            if (current !== this.path) {
                this.trigger(new PathChangeEvent(this.path, current));
            }
            this.path = current;
        }
    }
    /**
     * Update the hash location, either replacing the current entry, or adding
     * a new one to the browser history.
     *
     * @param {Location} location
     * @param {string} fragment
     * @param {boolean} replace
     * @memberof HistoryAPI
     */
    _updateHash(location, fragment, replace) {
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        }
        else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    }
    destroy() {
        this.off();
        this.stop();
    }
};
HistoryAPI = __decorate([
    slick_di_1.singleton(),
    __metadata("design:paramtypes", [Object])
], HistoryAPI);
exports.HistoryAPI = HistoryAPI;
