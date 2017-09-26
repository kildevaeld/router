"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_emitter_1 = require("./event-emitter");
const mixins_events_1 = require("mixins.events");
const history_1 = require("./history");
const optionalParam = /\((.*?)\)/g, namedParam = /(\(\?)?:\w+/g, splatParam = /\*\w+/g, escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
function isRegExp(value) {
    return value ? (typeof value === 'object' && toString.call(value) === '[object RegExp]') : false;
}
;
function isRouteHandler(a) {
    return typeof a === 'function';
}
class Router extends mixins_events_1.EventListener(event_emitter_1.EventEmitter) {
    constructor(root = "/", history = new history_1.HistoryAPI({ pushState: true, hashChange: true, root: root })) {
        super();
        this.history = history;
        this._routes = [];
        this.listenTo(this.history, history_1.FragmentChangeEvent, this._onHistoryChange);
        this.listenTo(this.history, history_1.PathChangeEvent, this._onHistoryChange);
    }
    path(path, name, handler) {
        return this.route(history_1.HistoryProvider.Push, path, name, handler);
    }
    fragment(hash, name, handler) {
        return this.route(history_1.HistoryProvider.Fragment, hash, name, handler);
    }
    route(kind, route, name, handler) {
        if (!isRegExp(route))
            route = this._routeToRegExp(route);
        if (isRouteHandler(name)) {
            handler = name;
            name = '';
        }
        if (!isRouteHandler(handler)) {
            throw new TypeError('router: no handler');
        }
        this._routes.push({
            route: route,
            name: name,
            handler: handler,
            kind: kind
        });
        return this;
    }
    _onHistoryChange(event) {
        for (let i = 0; i < this._routes.length; i++) {
            const route = this._routes[i];
            if (route.kind === event.kind && route.route.test(event.value)) {
                const params = this._extractParameters(route.route, event.value);
                if (!route.handler(event, ...params))
                    break;
            }
        }
    }
    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp(route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function (match, optional) {
            return optional ? match : '([^/?]+)';
        })
            .replace(splatParam, '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    }
    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters(route, fragment) {
        var params = (route.exec(fragment) || []).slice(1);
        return params.map(function (param, i) {
            // Don't decode the search params.
            if (i === params.length - 1)
                return param || null;
            return param ? decodeURIComponent(param) : null;
        }).filter(m => m != null);
    }
    destroy() {
        this.off();
        this.stopListening();
    }
}
exports.Router = Router;
(function (Router) {
    Router.inject = [history_1.HistoryAPI];
})(Router = exports.Router || (exports.Router = {}));
