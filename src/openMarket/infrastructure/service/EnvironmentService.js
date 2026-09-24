import merge from 'deepmerge'
export default class EnvironmentService{
  /**
   *
   * @param nodeEnvironment
   * @param baseConfig
   * @param devConfig
   * @param proConfig
   */
  constructor({nodeEnvironment, baseConfig, devConfig, proConfig, storeOverride}){
    this._config = this._mapConfig({
      env:nodeEnvironment,
      baseConfig,
      devConfig,
      proConfig,
      storeOverride
    });
  }

  _mapConfig({env, baseConfig, devConfig, proConfig, storeOverride}){
    const envConfig = (env) => {
      const mapping = {
        'development': devConfig,
        'production': proConfig
      }

      if (mapping.hasOwnProperty(env)) {
        return mapping[env]
      }

      return {}
    };
    const config = merge(baseConfig, envConfig(env));
    if (storeOverride) {
      return merge(config, { store: storeOverride });
    }
    return config;
  }

  get config() {
    return this._config;
  }
}
