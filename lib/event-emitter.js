"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixins_events_1 = require("mixins.events");
class Base {
}
exports.Base = Base;
class EventEmitter extends mixins_events_1.EventEmitter(Base) {
}
exports.EventEmitter = EventEmitter;
class TypedEventEmitter extends mixins_events_1.EventListener(EventEmitter) {
    on(e, callback, ctx) {
        let name;
        if (typeof e === 'string') {
            name = e;
        }
        else {
            name = e.name;
        }
        return super.on(name, callback, ctx);
    }
    once(e, callback, ctx) {
        let name;
        if (typeof e === 'string') {
            name = e;
        }
        else {
            name = e.name;
        }
        return super.once(name, callback, ctx);
    }
    off(e, callback, ctx) {
        let name;
        if (typeof e === 'string') {
            name = e;
        }
        else if (e && e.name) {
            name = e.name;
        }
        else {
            name = e;
        }
        return super.off(name, callback, ctx);
    }
    trigger(e, ...args) {
        if (typeof e === 'string') {
            return super.trigger(e, ...args);
        }
        if (e.constructor) {
            return super.trigger(e.constructor.name, e);
        }
        return this;
    }
}
exports.TypedEventEmitter = TypedEventEmitter;
