import { EventEmitter } from './event-emitter';
import { IEventListener } from 'mixins.events';
import { HistoryAPI, IHistoryChangeEvent, HistoryProvider } from './history';
export declare type RouteHandler = (event: IHistoryChangeEvent, ...args: string[]) => (boolean | void);
declare const Router_base: (new (...args: any[]) => IEventListener) & typeof EventEmitter;
export declare class Router extends Router_base implements IEventListener {
    readonly history: HistoryAPI;
    private _routes;
    constructor(history: HistoryAPI);
    path(path: string | RegExp, name: string | RouteHandler, handler?: RouteHandler): this;
    fragment(hash: string | RegExp, name: string | RouteHandler, handler?: RouteHandler): this;
    route(kind: HistoryProvider, route: string | RegExp, name: string | RouteHandler, handler?: RouteHandler): this;
    private _onHistoryChange(event);
    private _routeToRegExp(route);
    protected _extractParameters(route: RegExp, fragment: string): string[];
    destroy(): void;
}
export declare namespace Router {
    const inject: (typeof HistoryAPI)[];
}
