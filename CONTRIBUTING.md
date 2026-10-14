# Contributing

## Types

OpenMarket stays plain JavaScript. There are no `.ts` files. Types live in JSDoc, and `tsc --noEmit` (`npm run typecheck`) checks them. `npm run typecheck` must be green.

1. **Destructured parameters.** Document the whole object. Use an inline shape for one to three fields:

   ```js
   /**
    * @param {{id: string, name: string}} params
    */
   update({id, name}) {}
   ```

   For optional fields or defaults, use nested names. The name before the dot can be anything, but it must stay consistent:

   ```js
   /**
    * @param {object} [params]
    * @param {string} [params.barcode]
    * @param {Error} [params.cause]
    */
   constructor({barcode, cause} = {}) {}
   ```

   If the same shape appears in more than one place, use a `@typedef`.

2. **Type-only imports.** Put `@import` at the top of the file, after the real imports:

   ```js
   /** @import { Observable } from 'rxjs/Observable' */
   /** @import ProductImageSource from '../../domain/image/ProductImageSource' */
   ```

   A one-off reference can use `import()`: `@param {import('../order/Order').default} order`.
   Never add a real `import` only to name a type.

3. **Ports and adapters.** A port is a class marked `/** @interface */`. Every method throws `'<Port>#<method> must be implemented'` and has full JSDoc. An adapter does not `extends` the port:

   ```js
   /** @import OrderRepository from '../../domain/order/OrderRepository' */
   /** @implements {OrderRepository} */
   export default class SqliteOrderRepository {}
   ```

   Use cases type their dependencies as the port, never as the adapter.

4. **Shared shapes** go in a `@typedef` in the domain file that owns the concept, and other files import them with `@import`.

5. **Syntax.** Use TypeScript-style JSDoc: `string | null` (not `?string`), `Array<Product>` or `Product[]`, `Record<string, any>` (not `Object`), `(x: number) => void` (not `function(number)`), `Observable<T>` (not `Observable.<T>`). Don't use namepaths (`Foo#bar`), and don't leave types empty (`{}`).

6. **Observables.** A port method that returns an RxJS 5 stream is typed `Observable<T>`, imported from `'rxjs/Observable'`.

Every new port or adapter gets a `describeContract(...)` line in `src/test/openMarket/contracts/ports.spec.js`.

## Editors

**VS Code.** Nothing to install. The built-in JavaScript service reads the root `tsconfig.json` (`allowJs` and `checkJs`), so errors and hovers show up in `.js` files. If you had the Flow extension, uninstall or disable it for this workspace. Remove any `"javascript.validate.enable": false` from your user settings. After pulling, run *TypeScript: Restart TS Server*. Optionally run *TypeScript: Select TypeScript Version → Use Workspace Version* so the editor matches `npm run typecheck`.

**WebStorm.** Settings → Languages & Frameworks → JavaScript: set the language version to *ECMAScript 6+* (not *Flow*). Settings → Languages & Frameworks → TypeScript: enable the TypeScript language service and point it at the project's `node_modules/typescript`. It picks up `tsconfig.json`, and JSDoc types then drive completion and inspections.
