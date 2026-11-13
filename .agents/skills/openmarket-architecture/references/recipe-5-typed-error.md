## Recipe 5: add a typed error

1. Add a key to `domain/error/ErrorCode.js` (UPPER_SNAKE, stable. Logs and toasts branch on it.)
2. `domain/<ctx>/<Name>Error.js`:
```js
import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A supplier NIF failed the format check.
 */
export default class InvalidSupplierNifError extends AppError {
  /**
   * @param {{nif?: string}} [params]
   */
  constructor({nif} = {}) {
    super({
      code: ErrorCode.SUPPLIER_NIF_INVALID,
      message: `Supplier NIF ${nif} is not valid`,
      userMessage: 'invalid NIF',
      context: defined({nif}),
      level: 'warn'
    });
  }
}
```
3. Raise it: in Rx code `return observableError(new InvalidSupplierNifError({nif}))`. In sync code `raise(new …)`. When wrapping a driver failure in an adapter, use `rethrow(error, {message, context})`. Constructing an error doesn't log it. `record`/`raise`/`observableError` write exactly one JSON line.
