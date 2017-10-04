import EnvironmentService from "../../../../openMarket/infrastructure/service/EnvironmentService";
import { expect } from 'chai';

describe('Environment service', () => {
  describe('Given NODE_ENV as development', () => {
    it('should return DEV properties mixed with base properties', () => {
      const givenNodeEnvironment = 'development';
      const givenBaseConfig = {
        "store": "LocalStorage",
        "maxConnections": 10,
        "tableLimit": 20
      };
      const givenDevConfig = {
        "store": "LocalStorage"
      };
      const givenProConfig = {
        "store": "Mysql"
      };

      const environmentService = new EnvironmentService({
        nodeEnvironment: givenNodeEnvironment,
        baseConfig: givenBaseConfig,
        devConfig: givenDevConfig,
        proConfig: givenProConfig
      });

      const expectedConfig = {
        "store": "LocalStorage",
        "maxConnections": 10,
        "tableLimit": 20
      };

      expect(environmentService.config).to.deep.equal(expectedConfig);
    });
  });
  describe('Given NODE_ENV as production', () => {
    it('should return PRO properties mixed with base properties', () => {
      const givenNodeEnvironment = 'production';
      const givenBaseConfig = {
        "store": "LocalStorage",
        "maxConnections": 10,
        "tableLimit": 20
      };
      const givenDevConfig = {
        "store": "LocalStorage"
      };
      const givenProConfig = {
        "store": "Mysql"
      };

      const environmentService = new EnvironmentService({
        nodeEnvironment: givenNodeEnvironment,
        baseConfig: givenBaseConfig,
        devConfig: givenDevConfig,
        proConfig: givenProConfig
      });

      const expectedConfig = {
        "store": "Mysql",
        "maxConnections": 10,
        "tableLimit": 20
      };

      expect(environmentService.config).to.deep.equal(expectedConfig);
    });
  });

  describe('Given no set NODE_ENV ', () => {
    it('should return base properties', () => {
      const givenNodeEnvironment = undefined;
      const givenBaseConfig = {
        "store": "LocalStorage",
        "maxConnections": 10,
        "tableLimit": 20
      };
      const givenDevConfig = {
        "store": "LocalStorage"
      };
      const givenProConfig = {
        "store": "Mysql"
      };

      const environmentService = new EnvironmentService({
        nodeEnvironment: givenNodeEnvironment,
        baseConfig: givenBaseConfig,
        devConfig: givenDevConfig,
        proConfig: givenProConfig
      });

      const expectedConfig = {
        "store": "LocalStorage",
        "maxConnections": 10,
        "tableLimit": 20
      };

      expect(environmentService.config).to.deep.equal(expectedConfig);
    });
  });

  describe('Given no set baseConfig and NODE_ENV equals development ', () => {
    it('should return dev configuration', () => {
      const givenNodeEnvironment = 'development';
      const givenBaseConfig = undefined;
      const givenDevConfig = {
        "store": "LocalStorage"
      };
      const givenProConfig = {
        "store": "Mysql"
      };

      const environmentService = new EnvironmentService({
        nodeEnvironment: givenNodeEnvironment,
        baseConfig: givenBaseConfig,
        devConfig: givenDevConfig,
        proConfig: givenProConfig
      });

      const expectedConfig = {
        "store": "LocalStorage"
      };

      expect(environmentService.config).to.deep.equal(expectedConfig);
    });
  });

  describe('Given no set baseConfig and NODE_ENV equals production ', () => {
    it('should return dev configuration', () => {
      const givenNodeEnvironment = 'production';
      const givenBaseConfig = undefined;
      const givenDevConfig = {
        "store": "LocalStorage"
      };
      const givenProConfig = {
        "store": "Mysql"
      };

      const environmentService = new EnvironmentService({
        nodeEnvironment: givenNodeEnvironment,
        baseConfig: givenBaseConfig,
        devConfig: givenDevConfig,
        proConfig: givenProConfig
      });

      const expectedConfig = {
        "store": "Mysql"
      };

      expect(environmentService.config).to.deep.equal(expectedConfig);
    });
  });

});
