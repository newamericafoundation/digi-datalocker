import { CollectionsPrefix } from '@/constants'
import { Document } from '@/models/document'
import { File, getFilesByDocumentId } from '@/models/file'
import { createS3ZipFromS3Objects, S3ObjectDetails } from '@/utils/zip'
import { getCollectionDetails } from '@/services/collections'
import { connectDatabase } from '@/utils/database'

export interface CreateCollectionZipEvent {
  collectionId: string
  userId: string
}

connectDatabase()

// Thanks to https://dev.to/lineup-ninja/zip-files-on-s3-with-aws-lambda-and-node-1nm1
// and the underlying Stack Overflow answer https://stackoverflow.com/questions/38633577/create-a-zip-file-on-s3-from-files-on-s3-using-lambda-node/50397276#50397276
// for the approach taken here.

export const handler = async (event: CreateCollectionZipEvent) => {
  // fetch collection
  const { collectionId, userId } = event

  // read in documents
  const { documents, documentsHash } = await getCollectionDetails(collectionId)
  const downloadPath = `${CollectionsPrefix}/${collectionId}/${documentsHash}`

  // prepare file streams of files already in s3
  const fileNames = new Set<string>()
  const s3Objects: S3ObjectDetails[] = []
  for (const document of documents) {
    // get received files for a document
    const files = (await getFilesByDocumentId(document.id)).filter(
      (f) => f.received,
    )
    // create stream for file
    s3Objects.push(
      ...files.map((f) => {
        const filename = resolveFileName(document, f, files.length, fileNames)
        fileNames.add(filename)
        return {
          key: f.path,
          filename,
        }
      }),
    )
  }

  // stream files into zip
  return await createS3ZipFromS3Objects({
    key: downloadPath,
    objects: s3Objects,
    tags: `CreatedBy=${userId}`,
  })
}

const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.')
  if (parts.length === 1) return ''
  return '.' + parts.pop()
}

const resolveFileName = (
  document: Document,
  file: File,
  fileCount: number,
  fileNames: Set<string>,
) => {
  // if there is only one file, we'll name the file in the zip after the document name
  if (fileCount === 1) {
    const fileExtension = getFileExtension(file.name)
    const fileName = `${document.name}${fileExtension}`
    if (!fileNames.has(fileName)) return fileName
    return `${document.name} - ${file.id.substring(0, 8)}${fileExtension}`
  }

  // otherwise, we'll use a combination of the document name and file name
  const fileName = `${document.name} - ${file.name}`
  if (!fileNames.has(fileName)) return fileName
  return `${document.name} - ${file.order}${file.id.substring(0, 8)} ${
    file.name
  }`
}