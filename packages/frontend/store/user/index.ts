import { Module, VuexModule, Action } from 'vuex-module-decorators'
import { api } from '@/plugins/api-accessor'
import { Document, DocumentListItem, FileContentTypeEnum } from 'api-client'
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import { hashFile } from '@/assets/js/hash/'

@Module({
  name: 'user',
  stateFactory: true,
  namespaced: true,
})
export default class User extends VuexModule {
  // TODO: get user ID from API after login
  userId = '6ebb6c5f-2931-45bf-8482-f9dff5869a0f'

  // TODO: Update after upload API changes
  @Action
  async uploadDocument({
    fileList,
    onUploadProgress = () => {
      // default empty function
    },
  }: {
    fileList: FileList
    onUploadProgress?: (e: ProgressEvent) => void
  }): Promise<Document> {
    // FileList has a weird spec, with no iterator. This gets around it.
    const files = new Array(fileList.length)
    for (let i = 0; i < fileList.length; i++) {
      files[i] = fileList[i]
    }

    if (!files.length)
      return Promise.reject(new Error('Files must not be an empty list'))

    for (const file of files) {
      if (file.size > Math.pow(10, 7))
        throw new Error(`File ${file.name} is too large`)
      else if (file.size <= 0) throw new Error(`File ${file.name} is empty`)
    }

    const hashes = await Promise.all(files.map(hashFile))

    const addResponse: AxiosResponse<Document> = await api.user.addUserDocument(
      this.userId,
      {
        name: files[0].name
          .split('.')
          .slice(0, -1)
          .join('.'),
        files: files.map((file, i) => ({
          name: file.name,
          contentType: file.type as FileContentTypeEnum,
          sha256Checksum: hashes[i],
          contentLength: file.size,
        })),
      },
    )

    const axiosInstance = axios.create()
    // don't put our API token in the request otherwise we confuse AWS
    delete axiosInstance.defaults.headers.common.Authorization

    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0)
    const uploadProgress = new Array(files.length).fill(0)

    const uploadResponses = await Promise.all(
      addResponse.data.files.map((documentFile, i) => {
        const options: AxiosRequestConfig = {
          onUploadProgress: e => {
            uploadProgress[i] = e.loaded
            onUploadProgress(
              new ProgressEvent('upload', {
                loaded: uploadProgress.reduce((sum, val) => sum + val, 0),
                total: totalUploadSize,
              }),
            )
          },
        }

        const uploadLink = (documentFile.links as any[]).find(
          l => l.type === 'POST',
        )

        if (!uploadLink)
          return Promise.reject(
            new Error(
              `No upload link for file ${documentFile.name} (${documentFile.id})`,
            ),
          )

        const file = files.find(
          (_, i) => hashes[i] === documentFile.sha256Checksum,
        )
        if (!file)
          Promise.reject(
            new Error(
              `Corrupted hash for file ${documentFile.name} (${documentFile.id})`,
            ),
          )

        const formData = new FormData()
        Object.keys(uploadLink.includeFormData).forEach(key =>
          formData.append(key, uploadLink.includeFormData[key]),
        )
        formData.append('file', file)
        return axiosInstance.post(uploadLink.href, formData, options)
      }),
    )

    return addResponse.data
  }

  @Action
  getDocuments(): Promise<DocumentListItem[]> {
    return api.user
      .listUserDocuments(this.userId)
      .then(response =>
        response.data.documents ? response.data.documents : [],
      )
  }
}
