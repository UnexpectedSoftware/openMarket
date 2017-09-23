import merge from 'deepmerge'
import baseConfig from '../../../resources/application.json'
import dev from '../../../resources/application-dev.json'
import pro from '../../../resources/application-pro.json'

export default class EnvironmentService{
  /**
   *
   * @param {string} nodeEnvironment
   */
  constructor({nodeEnvironment}){
    this._config = this._mapConfig({env:nodeEnvironment});
  }

  _mapConfig({env}){
    const envConfig = (env) => {
      var mapping = {
        'development': dev,
        'production': pro
      }

      if (mapping.hasOwnProperty(env)) {
        return mapping[env]
      }

      return {}
    };
    return merge(baseConfig,envConfig(env));
  }

  get config() {
    return this._config;
  }
}
