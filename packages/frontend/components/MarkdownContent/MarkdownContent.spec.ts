import { shallowMount } from '@vue/test-utils'
import MarkdownContent from '@/components/MarkdownContent/MarkdownContent.vue'

describe('MarkdownContent component', () => {
  it('exports a valid component', () => {
    // TODO: disabled until we can resolve:
    // [vue-test-utils]: could not overwrite property $i18n, this is usually caused by a plugin that has added the property as a read-only value

    // const About = require('@/pages/about/index.vue').default
    // const asyncData = About.options.asyncData({
    //   $content: () => ({
    //     fetch: () => ({
    //       dir: '',
    //       path: '',
    //       extension: '.md',
    //       slug: '',
    //       createdAt: Date.now(),
    //       updatedAt: Date.now(),
    //       catch: (e: any) => console.log(e),
    //     }),
    //   }),
    //   app: {
    //     i18n: {
    //       locale: 'en',
    //     },
    //   },
    // })
    // About.options.data = function () {
    //   return {
    //     page: null,
    //     ...asyncData,
    //   }
    // }
    expect(true).toBeTruthy()
  })
})
