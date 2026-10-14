import {expect} from 'chai';

/**
 * Public method names declared on a port class (no constructor, no _private).
 * @param {Function} Port
 * @returns {string[]}
 */
export function portMethods(Port) {
  return Object.getOwnPropertyNames(Port.prototype)
    .filter(name => name !== 'constructor' && !name.startsWith('_'))
    .filter(name => typeof Port.prototype[name] === 'function');
}

/**
 * Registers one mocha `it` per port method, asserting the adapter has its own
 * implementation: present, not the inherited stub, not delegating to `super`.
 * @param {Function} Port
 * @param {Function} Adapter
 */
export function describeContract(Port, Adapter) {
  describe(`${Adapter.name} implements ${Port.name}`, () => {
    portMethods(Port).forEach(method => {
      it(`implements ${method}()`, () => {
        const impl = Adapter.prototype[method];
        expect(impl, `${Adapter.name}#${method} is missing`).to.be.a('function');
        expect(impl, `${Adapter.name}#${method} is the port stub`).not.to.equal(Port.prototype[method]);
        expect(impl.toString(), `${Adapter.name}#${method} is not implemented`)
          .not.to.match(/must be implemented|\bsuper\.\w+\(/);
      });
    });
  });
}
