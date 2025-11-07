/**
 * Detox Configuration
 * 
 * E2E testing configuration for iOS simulator.
 * Detox provides gray-box testing with access to native APIs.
 */

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: '__tests__/e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VoiceFit.app',
      build: 'xcodebuild -workspace ios/VoiceFit.xcworkspace -scheme VoiceFit -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/VoiceFit.app',
      build: 'xcodebuild -workspace ios/VoiceFit.xcworkspace -scheme VoiceFit -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
  },
};

