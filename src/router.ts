import { EventEmitter } from './event-emitter';
import { EventListener } from 'mixins.events';
import { HistoryAPI, FragmentChangeEvent, PathChangeEvent } from './history';

export class Router extends EventListener(EventEmitter) {

    constructor(
        root: string = "/",
        public readonly history: HistoryAPI = new HistoryAPI({ pushState: true, hashChange: true, root: root })
    ) {
        super()

        this.listenTo(this.history, (<any>FragmentChangeEvent), this._onFragmentChange);
        this.listenTo(this.history, (<any>PathChangeEvent), this._onPathChange);

    }






    private _onFragmentChange(event: FragmentChangeEvent) {
        console.log(event)
    }

    private _onPathChange(event: PathChangeEvent) {
        console.log(event)
    }



}