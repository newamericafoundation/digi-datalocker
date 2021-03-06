import {
  getCollectionsByOwnerId,
  Collection as CollectionModel,
} from '@/models/collection'
import {
  createMockEvent,
  importMock,
  mockUserData,
  setUserId,
  toMockedFunction,
} from '@/utils/test'
import { APIGatewayProxyEventV2 } from 'aws-lambda'
import createError from 'http-errors'
import { handler as getByUserId } from './getByUserId'

jest.mock('@/utils/database')
jest.mock('@/models/collection')
jest.mock('@/services/users')
jest.mock('@/services/users/authorization')
jest.mock('@/config')

describe('getByUserId', () => {
  const userId = 'myUserId'
  let event: APIGatewayProxyEventV2

  beforeEach(() => {
    mockUserData(userId)
    event = setUserId(
      userId,
      createMockEvent({
        pathParameters: {
          userId,
        },
      }),
    )
  })

  it('returns collections', async () => {
    toMockedFunction(getCollectionsByOwnerId).mockImplementationOnce(() =>
      Promise.resolve([
        CollectionModel.fromJson({
          id: 'myCollectionId1',
          ownerId: userId,
          name: 'My First Collection',
          createdAt: new Date('2015-01-12T13:14:15Z'),
          createdBy: userId,
          updatedBy: userId,
        }),
        CollectionModel.fromJson({
          id: 'myCollectionId2',
          ownerId: userId,
          name: 'My Second Collection',
          createdAt: new Date('2015-01-27T13:14:15Z'),
          createdBy: userId,
          updatedBy: userId,
        }),
      ]),
    )
    expect(await getByUserId(event)).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"collections\\":[{\\"name\\":\\"My First Collection\\",\\"createdDate\\":\\"2015-01-12T13:14:15.000Z\\",\\"id\\":\\"myCollectionId1\\",\\"links\\":[{\\"href\\":\\"/collections/myCollectionId1/documents\\",\\"rel\\":\\"documents\\",\\"type\\":\\"GET\\"},{\\"href\\":\\"/collections/myCollectionId1/grants\\",\\"rel\\":\\"grants\\",\\"type\\":\\"GET\\"}]},{\\"name\\":\\"My Second Collection\\",\\"createdDate\\":\\"2015-01-27T13:14:15.000Z\\",\\"id\\":\\"myCollectionId2\\",\\"links\\":[{\\"href\\":\\"/collections/myCollectionId2/documents\\",\\"rel\\":\\"documents\\",\\"type\\":\\"GET\\"},{\\"href\\":\\"/collections/myCollectionId2/grants\\",\\"rel\\":\\"grants\\",\\"type\\":\\"GET\\"}]}]}",
        "cookies": Array [],
        "headers": Object {
          "Content-Type": "application/json",
        },
        "isBase64Encoded": false,
        "statusCode": 200,
      }
    `)
  })
  it('returns 404 when user doesnt exist', async () => {
    event = setUserId('otherUserId', event)
    const requirePermissionToUserImpl = (
      await importMock('@/services/users/authorization')
    ).requirePermissionToUserImpl
    requirePermissionToUserImpl.mockImplementationOnce(() => {
      throw new createError.NotFound('user not found')
    })
    toMockedFunction(getCollectionsByOwnerId).mockImplementationOnce(() =>
      Promise.resolve([]),
    )
    expect(await getByUserId(event)).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"message\\":\\"user not found\\"}",
        "cookies": Array [],
        "headers": Object {
          "Content-Type": "application/json",
        },
        "isBase64Encoded": false,
        "statusCode": 404,
      }
    `)
  })
  it('returns empty when none found', async () => {
    toMockedFunction(getCollectionsByOwnerId).mockImplementationOnce(() =>
      Promise.resolve([]),
    )
    expect(await getByUserId(event)).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"collections\\":[]}",
        "cookies": Array [],
        "headers": Object {
          "Content-Type": "application/json",
        },
        "isBase64Encoded": false,
        "statusCode": 200,
      }
    `)
  })
})
