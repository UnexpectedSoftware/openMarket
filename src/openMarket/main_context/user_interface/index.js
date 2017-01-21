import Cycle from '@cycle/rx-run';
import {div, label, input, hr, h1, img, p, makeDOMDriver} from '@cycle/dom';
import makeOpenMarketDriver from '../infrastructure/cyclejs/OpenMarketDriver';
import {html} from 'snabbdom-jsx';


function main(sources) {
    const categoriesListAllUseCase$ = sources.OPENMARKET;

    return {
        DOM: categoriesListAllUseCase$
            .flatMap(categoriesListAllUseCase => categoriesListAllUseCase.findAll())
            .map(categories =>
                <div>
                    {
                        categories.map(category =>
                        <div>
                            <p>{category.name}</p>
                            <img src={category.imageUrl} with="100" height="100"></img>
                        </div>
                        )
                    }
                </div>
            )
    };
}

Cycle.run(main, {
    DOM: makeDOMDriver('#main-container'),
    OPENMARKET: makeOpenMarketDriver("categories_list_all_use_case")
});