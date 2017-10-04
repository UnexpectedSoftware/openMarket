import merge from 'deepmerge'
export default class EnvironmentService{
  /**
   *
   * @param nodeEnvironment
   * @param baseConfig
   * @param devConfig
   * @param proConfig
   */
  constructor({nodeEnvironment, baseConfig, devConfig, proConfig}){
    this._config = this._mapConfig({
      env:nodeEnvironment,
      baseConfig,
      devConfig,
      proConfig
    });
  }

  _mapConfig({env, baseConfig, devConfig, proConfig}){
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
    return merge(baseConfig,envConfig(env));
  }

  get config() {
    return this._config;
  }
}
