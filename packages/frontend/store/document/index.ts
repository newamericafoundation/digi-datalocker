/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Module, VuexModule, Action } from 'vuex-module-decorators'
import { api } from '@/plugins/api-accessor'
import { AxiosResponse } from 'axios'
import { Document, DocumentCreate } from 'api-client'

@Module({
  name: 'document',
  stateFactory: true,
  namespaced: true,
})
export default class DocumentStore extends VuexModule {
  @Action
  getById(id: string): Promise<Document> {
    return api.document
      .getDocumentById(id)
      .then((response: AxiosResponse<Document>) => response.data)
  }

  @Action
  update(document: Document) {
    api.document.updateDocumentById(document.id!, document as DocumentCreate)
  }
}