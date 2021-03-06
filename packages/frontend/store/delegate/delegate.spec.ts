import { api } from '@/plugins/api-accessor'
import { createStore } from '@/.nuxt/store'
import initialiseStores, { userStore } from '@/plugins/store-accessor'
import {
  Document,
  FileDownloadDispositionTypeEnum,
  UserDelegatedAccess,
  UserDelegatedAccessStatus,
} from 'api-client'
import VueAnalytics from 'vue-analytics'
import createMockGa from '@/__mocks__/vue-analytics'
import { UserRole } from '@/types/user'

jest.mock('@/plugins/api-accessor', () => ({
  api: {
    delegate: {
      acceptDelegatedAccount: jest.fn((delegateId: string) =>
        Promise.resolve({
          data: {
            id: '1',
            email: 'delegate@twobulls.com',
            allowsAccessToUser: undefined,
            createdDate: '2020-11-22T00:00:00.000Z',
            status: UserDelegatedAccessStatus.ACTIVE,
            links: [],
          } as UserDelegatedAccess,
        }),
      ),
    },
  },
}))

const axiosPost = jest.fn()

jest.mock('axios', () => ({
  create: () => ({
    post: axiosPost,
    defaults: {
      headers: {
        common: {},
      },
    },
  }),
}))

Date.now = jest.fn(() => new Date(Date.UTC(2020, 10, 22)).valueOf())

const createTestStore = ($ga?: VueAnalytics) => {
  const store = createStore()
  initialiseStores({
    store,
    $ga: $ga || createMockGa(),
  })
  // store.commit('user/setRole', UserRole.CLIENT)
  return store
}

test('DelegateStore.acceptInvite [Happy case]', async () => {
  const mockGa = createMockGa()
  const store = createTestStore(mockGa)
  store.commit('user/_setRole', 0)
  expect.assertions(5)
  await store.dispatch('delegate/acceptInvite', '1')

  expect(
    (<jest.Mock<typeof api.delegate.acceptDelegatedAccount>>(
      (api.delegate.acceptDelegatedAccount as any)
    )).mock.calls.length,
  ).toBe(1)

  const eventCalls = (<jest.Mock>mockGa.event).mock.calls
  expect(eventCalls.length).toBe(1)
  expect(eventCalls[0][0].eventCategory).toBeDefined()
  expect(eventCalls[0][0].eventAction).toBeDefined()
  expect(eventCalls[0][0].eventLabel).toBe(UserRole[UserRole.CLIENT])
})
