import {
  RekognitionClient,
  CreateCollectionCommand, DeleteCollectionCommand,
  IndexFacesCommand, SearchFacesByImageCommand,
  DetectModerationLabelsCommand, DetectLabelsCommand,
  DetectFacesCommand, DeleteFacesCommand,
} from '@aws-sdk/client-rekognition'
import { logger } from './logger'

const rek = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!

export async function createCollection(collectionId: string): Promise<void> {
  await rek.send(new CreateCollectionCommand({ CollectionId: collectionId }))
}

export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    await rek.send(new DeleteCollectionCommand({ CollectionId: collectionId }))
  } catch { /* already deleted */ }
}

export async function indexFaces(collectionId: string, s3Key: string, photoId: string): Promise<string[]> {
  try {
    const res = await rek.send(new IndexFacesCommand({
      CollectionId: collectionId,
      Image: { S3Object: { Bucket: BUCKET, Name: s3Key } },
      ExternalImageId: photoId,
      DetectionAttributes: ['DEFAULT'],
      MaxFaces: 20,
    }))
    return (res.FaceRecords || []).map(r => r.Face?.FaceId).filter(Boolean) as string[]
  } catch (err) {
    logger.error('SYSTEM', 'Rekognition indexFaces failed', { photoId, errorCode: 'PS-503' })
    return []
  }
}

export async function searchFacesBySelfie(
  collectionId: string, selfieKey: string, threshold = 80
): Promise<{ photoId: string; confidence: number }[]> {
  const res = await rek.send(new SearchFacesByImageCommand({
    CollectionId: collectionId,
    Image: { S3Object: { Bucket: BUCKET, Name: selfieKey } },
    FaceMatchThreshold: threshold,
    MaxFaces: 100,
  }))
  return (res.FaceMatches || []).map(m => ({
    photoId: m.Face?.ExternalImageId || '',
    confidence: m.Similarity || 0,
  })).filter(m => m.photoId)
}

export async function detectModeration(s3Key: string): Promise<{ flagged: boolean; reason: string; confidence: number }> {
  const res = await rek.send(new DetectModerationLabelsCommand({
    Image: { S3Object: { Bucket: BUCKET, Name: s3Key } },
    MinConfidence: 50,
  }))
  const labels = res.ModerationLabels || []
  if (labels.length === 0) return { flagged: false, reason: '', confidence: 0 }
  const top = labels[0]
  return { flagged: true, reason: top.Name || 'Unknown', confidence: top.Confidence || 0 }
}

export async function detectLabels(s3Key: string): Promise<{ label: string; confidence: number }[]> {
  try {
    const res = await rek.send(new DetectLabelsCommand({
      Image: { S3Object: { Bucket: BUCKET, Name: s3Key } },
      MaxLabels: 10, MinConfidence: 80,
    }))
    return (res.Labels || []).map(l => ({ label: l.Name || '', confidence: l.Confidence || 0 }))
  } catch { return [] }
}

export async function detectFaceQuality(s3Key: string): Promise<number> {
  try {
    const res = await rek.send(new DetectFacesCommand({
      Image: { S3Object: { Bucket: BUCKET, Name: s3Key } },
      Attributes: ['ALL'],
    }))
    const faces = res.FaceDetails || []
    if (faces.length === 0) return 0
    const brightness = faces[0].Quality?.Brightness || 0
    const sharpness  = faces[0].Quality?.Sharpness  || 0
    return Math.round((brightness + sharpness) / 2)
  } catch { return 0 }
}

export async function deleteFaces(collectionId: string, faceIds: string[]): Promise<void> {
  if (!faceIds.length) return
  for (let i = 0; i < faceIds.length; i += 4096) {
    await rek.send(new DeleteFacesCommand({
      CollectionId: collectionId,
      FaceIds: faceIds.slice(i, i + 4096),
    }))
  }
}
