import { FileType, Prisma, PrismaClient } from "@prisma/client";

export const PROFILE_IMAGE_TYPES: FileType[] = ["FACE_PHOTO", "CITIZEN_CARD"];

type ProfileImageInput = {
  type: FileType;
  path: string;
};

const isProfileImageType = (value: unknown): value is FileType =>
  value === "FACE_PHOTO" || value === "CITIZEN_CARD";

export const normalizeProfileImages = (profileImages: unknown): ProfileImageInput[] => {
  if (!Array.isArray(profileImages)) {
    return [];
  }

  const uniqueImages = new Map<FileType, string>();

  for (const image of profileImages) {
    if (!image || typeof image !== "object") {
      continue;
    }

    const { type, path } = image as { type?: unknown; path?: unknown };

    if (!isProfileImageType(type) || typeof path !== "string") {
      continue;
    }

    const trimmedPath = path.trim();
    if (!trimmedPath) {
      continue;
    }

    uniqueImages.set(type, trimmedPath);
  }

  return Array.from(uniqueImages.entries()).map(([type, path]) => ({ type, path }));
};

export const syncProfileImages = async (
  client: Prisma.TransactionClient | PrismaClient,
  userId: number,
  profileImages: unknown
) => {
  const normalizedImages = normalizeProfileImages(profileImages);

  await client.file_info.deleteMany({
    where: {
      createdBy: userId,
      type: { in: PROFILE_IMAGE_TYPES },
    },
  });

  if (normalizedImages.length === 0) {
    return;
  }

  await client.file_info.createMany({
    data: normalizedImages.map((image) => ({
      createdBy: userId,
      type: image.type,
      path: image.path,
    })),
  });
};
