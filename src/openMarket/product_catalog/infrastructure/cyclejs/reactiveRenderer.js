import {ipcRenderer} from 'electron';
import Rx from 'rx';
const ipcRendererSubject = new Rx.Subject();

export default function(useCase) {
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
        arg.forEach(data => ipcRendererSubject.onNext(data));
    });
    return ipcRendererSubject;
}