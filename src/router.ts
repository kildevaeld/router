import { EventEmitter } from './event-emitter';
import { EventListener, IEventListener } from 'mixins.events';
import { HistoryAPI, IHistoryChangeEvent, FragmentChangeEvent, PathChangeEvent, HistoryProvider } from './history';
import {autoinject} from 'slick-di';

const optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

function isRegExp(value: any): value is RegExp {
    return value ? (typeof value === 'object' && toString.call(value) === '[object RegExp]') : false;
};

function isRouteHandler(a: any): a is RouteHandler {
    return typeof a === 'function';
}


export type RouteHandler = (event: IHistoryChangeEvent, ...args: string[]) => (boolean | void);

interface Route {
    route: RegExp;
    name: string;
    handler: RouteHandler;
    kind: HistoryProvider
}

@autoinject
export class Router extends EventListener(EventEmitter) implements IEventListener {

    private _routes: Route[] = [];

    constructor(
        public readonly history: HistoryAPI
    ) {
        super()

        this.listenTo(this.history, (<any>FragmentChangeEvent), this._onHistoryChange);
        this.listenTo(this.history, (<any>PathChangeEvent), this._onHistoryChange);

    }


    path(path: string | RegExp, name: string | RouteHandler, handler?: RouteHandler) {
        return this.route(HistoryProvider.Push, path, name, handler);
    }

    fragment(hash: string | RegExp, name: string | RouteHandler, handler?: RouteHandler) {
        return this.route(HistoryProvider.Fragment, hash, name, handler);
    }

    route(kind: HistoryProvider, route: string | RegExp, name: string | RouteHandler, handler?: RouteHandler) {
        if (!isRegExp(route)) route = this._routeToRegExp(<string>route);
        if (isRouteHandler(name)) {
            handler = <RouteHandler>name;
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

    private _onHistoryChange(event: IHistoryChangeEvent) {
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
    private _routeToRegExp(route: string): RegExp {
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
    protected _extractParameters(route: RegExp, fragment: string): string[] {
        var params = (route.exec(fragment)! || []).slice(1);
        return params.map(function (param, i) {
            // Don't decode the search params.
            if (i === params.length - 1) return param || null;
            return param ? decodeURIComponent(param) : null;
        }).filter(m => m != null) as string[];
    }


    destroy() {
        this.off();
        this.stopListening();
    }


}

export namespace Router {
    export const inject = [HistoryAPI]
}