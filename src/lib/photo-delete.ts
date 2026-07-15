import { db } from './db'
import { deleteObject } from './aws-s3'
import { deleteFaces } from './aws-rekognition'

interface DeletablePhoto {
  id: string; eventId: string; s3Key: string; thumbnailKey: string | null
  faceIds: string[]; fileSize: number; isFlagged: boolean
  moderationFlag: { photoId: string } | null
  event: { rekognitionCollectionId: string }
}

export async function deletePhoto(photo: DeletablePhoto, userId: string): Promise<void> {
  const deleteOps: Promise<unknown>[] = [deleteObject(photo.s3Key)]
  if (photo.thumbnailKey) deleteOps.push(deleteObject(photo.thumbnailKey))
  await Promise.allSettled(deleteOps)

  if (photo.faceIds.length > 0) {
    await deleteFaces(photo.event.rekognitionCollectionId, photo.faceIds)
  }

  const freed = BigInt(photo.fileSize)
  await db.$transaction([
    ...(photo.moderationFlag ? [db.moderationFlag.delete({ where: { photoId: photo.id } })] : []),
    db.photo.delete({ where: { id: photo.id } }),
    db.event.update({
      where: { id: photo.eventId },
      data: {
        photoCount: { decrement: 1 },
        pendingReviewCount: photo.isFlagged ? { decrement: 1 } : undefined,
      },
    }),
    db.user.update({ where: { id: userId }, data: { storageUsed: { decrement: freed } } }),
  ])
}
