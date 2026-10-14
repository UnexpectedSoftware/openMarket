import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {userText} from '../../infrastructure/logging/ErrorLog';
import {
  PLUGIN_SAVE_REQUESTED,
  PLUGINS_PAGE_LOADED,
  pluginSaveFailed,
  pluginsListed,
  pluginsSaved
} from './action';

/**
 * @param {{listPlugins: {list: Function}, savePlugin: {save: Function}}} deps
 */
export function makePluginsEpic({listPlugins, savePlugin}) {
  const load = action$ => action$
    .filter(action => action.type === PLUGINS_PAGE_LOADED)
    .flatMap(() => listPlugins.list()
      .map(page => pluginsListed(page))
      .catch(error => Rx.Observable.of(pluginSaveFailed(userText(error, 'Plugins could not be loaded')))));

  const save = action$ => action$
    .filter(action => action.type === PLUGIN_SAVE_REQUESTED)
    .flatMap(action => savePlugin.save(action.command)
      .flatMap(() => listPlugins.list().map(page => pluginsSaved(page)))
      .catch(error => Rx.Observable.of(pluginSaveFailed(userText(error, 'Plugin was not saved')))));

  return action$ => Rx.Observable.merge(load(action$), save(action$));
}
