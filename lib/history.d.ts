import { TypedEventEmitter } from './event-emitter';
export declare enum HistoryProvider {
    Fragment = 1,
    Push = 2,
    Both = 3,
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
export declare class PathChangeEvent implements IHistoryChangeEvent {
    old: string;
    value: string;
    kind: HistoryProvider;
    constructor(old: string, value: string);
}
export declare class FragmentChangeEvent extends PathChangeEvent {
    kind: HistoryProvider;
}
export declare class HistoryAPI extends TypedEventEmitter<any> {
    options: HistoryOptions;
    history: History;
    private location;
    private root;
    private _started;
    fragment: string;
    path: string;
    readonly started: boolean;
    readonly atRoot: boolean;
    constructor(options?: HistoryOptions);
    start(): void;
    stop(): void;
    navigate(kind: HistoryProvider, part: string, options?: NavigateOptions): any;
    getHash(window?: Window): string;
    getFragment(fragment: string | HistoryProvider.Fragment | HistoryProvider.Push, _?: boolean): string;
    private checkUrlFragment();
    private checkPushUrl();
    protected checkUrl(part: HistoryProvider): void;
    /**
     * Update the hash location, either replacing the current entry, or adding
     * a new one to the browser history.
     *
     * @param {Location} location
     * @param {string} fragment
     * @param {boolean} replace
     * @memberof HistoryAPI
     */
    private _updateHash(location, fragment, replace);
    destroy(): void;
}
