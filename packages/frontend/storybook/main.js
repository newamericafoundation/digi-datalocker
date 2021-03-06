module.exports = {
  stories: ['../components/**/*.stories.ts', '../pages/**/*.stories.ts'],
  addons: [
    '@storybook/addon-knobs',
    '@storybook/addon-viewport',
    '@storybook/addon-contexts',
  ],
  webpackFinal(config, options) {
    config = options.nuxtStorybookConfig.webpackFinal(config, options)
    return config
  },
}
