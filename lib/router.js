"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_emitter_1 = require("./event-emitter");
const history_1 = require("./history");
class Router extends event_emitter_1.EventEmitter {
    constructor(history = new history_1.HistoryAPI({ pushState: true, hashChange: true })) {
        super();
        this.history = history;
    }
}
exports.Router = Router;
