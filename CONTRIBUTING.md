# Contributing

## Types

OpenMarket stays plain JavaScript. There are no `.ts` files. Types live in JSDoc, and `tsc --noEmit` (`npm run typecheck`) checks them. `npm run typecheck` must be green.

1. **Destructured parameters.** Document the whole object as one type. WebStorm copies that type onto each binding. Nested `@param {Type} params.name` tags typecheck, and the binding hover stays `any`.

   ```js
   /**
    * @param {{id: string, name: string}} params
    */
   update({id, name}) {}
   ```

   Optional fields and defaults stay in that same type:

   ```js
   /**
    * @param {{barcode?: string, cause?: Error}} [params]
    */
   constructor({barcode, cause} = {}) {}
   ```

   If the same shape appears in more than one place, use a `@typedef`.

2. **Type-only imports.** Bind each name with `@typedef` and `import()`, after the real imports. WebStorm and IntelliJ follow `import()` inside `@typedef`. They do not bind a JSDoc `@import` name, so go-to-declaration stops on that comment.

   ```js
   /** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
   /** @typedef {import('../../domain/image/ProductImageSource').default} ProductImageSource */
   ```

   `Observable` needs `@template T`. A plain `@typedef` of the class is not generic, and `Observable<Product>` then fails `tsc`.
   A one-off reference can use `import()` inline: `@param {import('../order/Order').default} order`.
   Never add a real `import` only to name a type.

3. **Ports and adapters.** A port is a class marked `/** @interface */`. Every method throws `'<Port>#<method> must be implemented'` and has full JSDoc. An adapter does not `extends` the port:

   ```js
   /** @typedef {import('../../domain/order/OrderRepository').default} OrderRepository */
   /** @implements {OrderRepository} */
   export default class SqliteOrderRepository {}
   ```

   Use cases type their dependencies as the port, never as the adapter.

4. **Shared shapes** go in a `@typedef` in the domain file that owns the concept. Other files bind them with `/** @typedef {import('…').Name} Name */`.

5. **Syntax.** Use TypeScript-style JSDoc: `string | null` (not `?string`), `Array<Product>` or `Product[]`, `Record<string, any>` (not `Object`), `(x: number) => void` (not `function(number)`), `Observable<T>` (not `Observable.<T>`). Don't use namepaths (`Foo#bar`), and don't leave types empty (`{}`).

6. **Observables.** A port method that returns an RxJS 5 stream is typed `Observable<T>`. Bind it with `/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */`.

Every new port or adapter gets a `describeContract(...)` line in `src/test/openMarket/contracts/ports.spec.js`.

## Editors

**VS Code.** Nothing to install. The built-in JavaScript service reads the root `tsconfig.json` (`allowJs` and `checkJs`), so errors and hovers show up in `.js` files. If you had the Flow extension, uninstall or disable it for this workspace. Remove any `"javascript.validate.enable": false` from your user settings. After pulling, run *TypeScript: Restart TS Server*. Optionally run *TypeScript: Select TypeScript Version → Use Workspace Version* so the editor matches `npm run typecheck`.

**WebStorm.** Settings → Languages & Frameworks → JavaScript: set the language version to *ECMAScript 6+* (not *Flow*). Settings → Languages & Frameworks → TypeScript: enable the TypeScript language service and point it at the project's `node_modules/typescript`. Ctrl+click a name bound with `@typedef {import('…').default}` to open the typedef; the `import()` path opens the module. A destructured parameter is typed only from an object `@param`, as in rule 1. Search for `@implements {PortName}` to find an adapter. Nothing `extends` the port. With TypeScript 7.0, **Enable service-powered type engine** can drop member completion.
