import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
};

const AVATAR_MAX_DIMENSION = 512;

/**
 * Opens the library, allows a square crop, and returns a compressed image.
 * Returns null if the user cancels.
 */
export async function pickAndCompressImage(
  opts: { allowsEditing?: boolean; aspect?: [number, number]; maxDimension?: number } = {}
): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('We need photo access so you can add a photo. Enable it in Settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: opts.allowsEditing ?? true,
    aspect: opts.aspect ?? [1, 1],
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const max = opts.maxDimension ?? AVATAR_MAX_DIMENSION;

  const width = asset.width;
  const height = asset.height;
  const resizeWidth = width > height ? max : Math.round((max * width) / height);
  const resizeHeight = height > width ? max : Math.round((max * height) / width);

  const context = ImageManipulator.manipulate(asset.uri);
  context.resize({ width: resizeWidth, height: resizeHeight });
  const image = await context.renderAsync();
  const manipulated = await image.saveAsync({
    compress: 0.82,
    format: SaveFormat.JPEG,
  });

  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
    mimeType: asset.mimeType && asset.mimeType !== 'image/heic' ? asset.mimeType : 'image/jpeg',
  };
}