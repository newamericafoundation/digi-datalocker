import BaseModel from './base-model'
import { v4 as uuidv4 } from 'uuid'
import { Model, QueryBuilder } from 'objection'

export class File extends BaseModel {
  public id: string
  public documentId: string
  public name: string
  public path: string
  public received: boolean
  public contentType: string
  public contentLength: number
  public sha256Checksum: string
  public createdAt: Date
  public createdBy: string

  static get tableName() {
    return 'files'
  }

  static get maxFileSize() {
    return 10000000
  }

  static get modifiers() {
    return {
      byDocumentId(query: QueryBuilder<File>, documentId: string) {
        return query.where({
          documentId,
        })
      },
      byId(query: QueryBuilder<File>, id: string) {
        return query.where({
          id,
        }).first
      },
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'documentId',
        'name',
        'path',
        'received',
        'contentType',
        'sha256Checksum',
        'createdAt',
        'createdBy',
      ],
      properties: {
        id: { type: 'string', minLength: 1, maxLength: 40 },
        documentId: { type: 'string', minLength: 1, maxLength: 40 },
        name: { type: 'string', maxLength: 255 },
        path: { type: 'string', maxLength: 500 },
        received: { type: 'boolean' },
        contentType: { type: 'string', maxLength: 255 },
        contentLength: {
          type: 'integer',
          minimum: 1,
          maximum: 10 * 1024 * 1024,
        },
        sha256Checksum: { type: 'string', maxLength: 255 },
        createdAt: { type: 'date-time' },
        createdBy: { type: 'string', maxLength: 255 },
      },
    }
  }

  static get relationMappings() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Document = require('./document').Document
    return {
      document: {
        relation: Model.BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'files.documentId',
          to: 'documents.id',
        },
      },
    }
  }

  async $beforeInsert() {
    if (!this.id) this.$id(uuidv4())
  }
}

export const markFileReceived = async (path: string) => {
  await File.query().patch({ received: true }).where({ path })
  return await File.query().where({ path }).first()
}