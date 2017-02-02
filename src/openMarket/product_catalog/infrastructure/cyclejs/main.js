import {ipcRenderer} from 'electron';
import Rx from 'rx';
const ipcRendererSubject$ = new Rx.Subject();

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    arg.forEach(data => ipcRendererSubject$.onNext(data));
});
ipcRendererSubject$.map(category => console.log(category.name));

ipcRenderer.send('asynchronous-message', 'categories_list_all_use_case');
