import { IEventListener, IEventEmitter } from 'mixins.events';
export interface EventConstructor<T> {
    new (...args: any[]): T;
    prototype: T;
}
export interface TypedEventHandler<T> {
    (e: T): void;
}
export declare class Base {
}
declare const EventEmitter_base: (new (...args: any[]) => IEventEmitter) & typeof Base;
export declare class EventEmitter extends EventEmitter_base implements IEventEmitter {
}
declare const TypedEventEmitter_base: (new (...args: any[]) => IEventListener) & typeof EventEmitter;
export declare class TypedEventEmitter<U> extends TypedEventEmitter_base implements IEventListener {
    on<T extends U>(e: EventConstructor<T> | string, callback: TypedEventHandler<T>, ctx?: any): this;
    once<T extends U>(e: EventConstructor<T> | string, callback: TypedEventHandler<T>, ctx?: any): this;
    off<T extends U>(e?: EventConstructor<T> | string, callback?: TypedEventHandler<T>, ctx?: any): this;
    trigger<T extends U>(e: T | string, ...args: any[]): this;
}
