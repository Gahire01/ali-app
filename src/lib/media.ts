import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

type Options = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  maxDimension?: number;
  quality?: number;
};

export async function pickAndCompressImage(options: Options = {}): Promise<PickedImage | null> {
  const {
    allowsEditing = true,
    aspect = [1, 1],
    maxDimension = 1080,
    quality = 0.8,
  } = options;

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Photo permission is required to pick an image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const width = asset.width ?? maxDimension;
  const height = asset.height ?? maxDimension;

  // Only resize if larger than maxDimension to avoid upscaling
  const actions: ImagePicker.ImagePickerAsset extends never ? never : any[] = [];
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      actions.push({ resize: { width: maxDimension } });
    } else {
      actions.push({ resize: { height: maxDimension } });
    }
  }

  const manipulated = await manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: SaveFormat.JPEG,
  });

  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
  };
}
