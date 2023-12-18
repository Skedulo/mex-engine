const { defaults: tsjPreset } = require('ts-jest/presets')

module.exports = {
    preset: 'react-native',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.spec.json',
        },
    },
    setupFiles: ["<rootDir>/__tests_data__/global.js"],
    transform: {
        '^.+\\.jsx$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.ts?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    testEnvironmentOptions: {
        "url": "http://localhost/"
    }
}
