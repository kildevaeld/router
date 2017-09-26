import { TypedEventEmitter } from './event-emitter';

// Cached regex for stripping a leading hash/slash and trailing space.
const routeStripper = /^[#\/]|\s+$/g,
    // Cached regex for stripping leading and trailing slashes.
    rootStripper = /^\/+|\/+$/g,
    // Cached regex for removing a trailing slash.
    trailingSlash = /\/$/,
    // Cached regex for stripping urls of hash and query.
    pathStripper = /[#].*$/;

export enum HistoryProvider {
    Fragment = 1, Push, Both
}
export interface HistoryOptions {
    pushState?: boolean;
    root?: string;
    hashChange?: boolean;
}

export interface NavigateOptions {
    trigger?: boolean;
    replace?: boolean;
}

export interface IHistoryChangeEvent {
    kind: HistoryProvider;
    old: string;
    value: string;
}

export class PathChangeEvent implements IHistoryChangeEvent {
    kind: HistoryProvider = HistoryProvider.Push
    constructor(public old: string, public value: string) { }
}

export class FragmentChangeEvent extends PathChangeEvent {
    kind: HistoryProvider = HistoryProvider.Fragment
 }



export class HistoryAPI extends TypedEventEmitter<any> {
    public history: History
    private location: Location;
    private root: string;
    private _started: boolean = false

    fragment: string
    path: string;

    get started() {
        return this._started;
    }

    get atRoot() {
        return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    }



    constructor(public options: HistoryOptions = {}) {
        super();
        this.root = this.options.root || '/';

        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
        this.checkPushUrl = this.checkPushUrl.bind(this);
        this.checkUrlFragment = this.checkUrlFragment.bind(this);
    }
    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start() {
        if (this.started) throw new Error("Router.history has already been started");
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
        if (!this.started) return;

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
    navigate(kind: HistoryProvider, part: string, options?: NavigateOptions): any {
        if (!this.started) return false;
        if (!options || options === true) options = { trigger: !!options };

        var url = this.root + (part = this.getFragment(part || ''));

        // Strip the hash for matching.
        part = part.replace(pathStripper, '');

        switch (kind) {
            case HistoryProvider.Fragment: {
                if (this.fragment == part) return;
                break;
            }
            case HistoryProvider.Push: {
                if (this.path == part) return;
                break;
            }
        }

        // Don't include a trailing slash on the root.
        if (part === '' && url !== '/') url = url.slice(0, -1);

        if (kind === HistoryProvider.Push) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
            if (options.trigger) this.checkUrl(HistoryProvider.Both);
            else this.path = part;
        } else if (kind == HistoryProvider.Fragment) {
            this._updateHash(this.location, part, options.replace || false);
            if (options.trigger) this.checkUrl(kind)
            else this.fragment = part;
        } else {
            return this.location.assign(url);
        }

    }


    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash(window?: Window) {
        var match = (window! || this).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    }

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment(fragment: string | HistoryProvider.Fragment | HistoryProvider.Push, _: boolean = false) {
        if (typeof fragment === 'string') {
            return fragment.replace(routeStripper, '');
        }

        switch (fragment) {
            case HistoryProvider.Fragment:
                return this.getHash();
            case HistoryProvider.Push: {
                let fragment = decodeURI(this.location.pathname + this.location.search);
                var root = this.root.replace(trailingSlash, '');
                if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
                return fragment;
            }
            default:
                throw new TypeError("fragment should a string or number");
        }
    }


    private checkUrlFragment() {
        this.checkUrl(HistoryProvider.Fragment)
    }

    private checkPushUrl() {
        this.checkUrl(HistoryProvider.Push);
    }

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`.
    protected checkUrl(part: HistoryProvider) {

        const { Both, Push, Fragment } = HistoryProvider;

        if (~[Both, Fragment].indexOf(part)) {
            const current = this.getFragment(Fragment);
            if (current !== this.fragment /*&& (current == "" && this.fragment != undefined)*/) {
                this.trigger(new FragmentChangeEvent(this.fragment, current))
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
    private _updateHash(location: Location, fragment: string, replace: boolean) {
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        } else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    }

    destroy() {
        this.off();
        this.stop();
    }
} 