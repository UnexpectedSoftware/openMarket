import Cycle from '@cycle/rx-run';
import {div, label, input, hr, h1, p, makeDOMDriver} from '@cycle/dom';
import openMarket from '../../index';
import Rx from 'rx';
function main(sources) {
    const categories$ = sources.OPENMARKET;
    return {
        DOM: categories$
            .flatMap(categories => Rx.Observable.from(categories))
            .map(category => p(`hello ${category.name}`))
    };
}

Cycle.run(main, {
    DOM: makeDOMDriver('#main-container'),
    OPENMARKET: () => { return openMarket.get("categories_list_all_use_case").findAll()}
});