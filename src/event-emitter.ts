import { EventEmitter as EE, IEventListener, EventListener, IEventEmitter } from 'mixins.events'

export interface EventConstructor<T> {
    new(...args: any[]): T
    prototype: T
}

export interface TypedEventHandler<T> {
    (e: T): void;
}


export class Base { }

export class EventEmitter extends EE(Base) implements IEventEmitter {

}

export class TypedEventEmitter<U> extends EventListener(EventEmitter) implements IEventListener {

    on<T extends U>(e: EventConstructor<T> | string, callback: TypedEventHandler<T>, ctx?: any) {
        let name: string;
        if (typeof e === 'string') {
            name = e;
        } else {
            name = e.name;
        }
        return super.on(name, callback, ctx);
    }

    once<T extends U>(e: EventConstructor<T> | string, callback: TypedEventHandler<T>, ctx?: any) {
        let name: string;
        if (typeof e === 'string') {
            name = e;
        } else {
            name = e.name;
        }
        return super.once(name, callback, ctx);
    }

    off<T extends U>(e: EventConstructor<T> | string, callback: TypedEventHandler<T>, ctx?: any) {
        let name;
        if (typeof e === 'string') {
            name = e;
        } else if (e && e.name) {
            name = e.name;
        } else {
            name = e;
        }
        return super.off(name, callback, ctx);
    }

    trigger<T extends U>(e: T | string, ...args: any[]) {
        if (typeof e === 'string') {
            return super.trigger(e, ...args);
        }
        if (e.constructor) {
            return super.trigger(e.constructor.name, e);
        }

        return this
    }


}

