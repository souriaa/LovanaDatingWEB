import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabase";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const getUserImageSrc = (imagePath) => {
  if (imagePath) {
    return getSupabaseFileUrl(imagePath);
  } else {
    return null
  }
};

export const getSupabaseFileUrl = (filePath) => {
  if (filePath) {
    return {
      uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`,
    };
  }
  return null;
};

export const downloadFile = async (url) => {
  try {
    const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url))
    return uri
  } catch (error) {
    return null
  }
};

export const getLocalFilePath = filePath => {
  let fileName = filePath.split('/').pop()
  return `${FileSystem.documentDirectory}${fileName}`
};

export const uploadFile = async (folderName, fileUri, isImage = true) => {
  try {
    const fileName = getFilePath(folderName, isImage);
    const contentType = isImage ? "image/jpeg" : "video/mp4";

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBuffer = decode(base64);

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.log("file upload error:", error);
      return { success: false, msg: error.message };
    }

    return { success: true, data: data.path };
  } catch (error) {
    console.log("file upload error", error);
    return { success: false, msg: error.message };
  }
};


export const getFilePath = (folderName, isImage = true) => {
  return `${folderName}/${new Date().getTime()}${isImage ? ".png" : ".mp4"}`;
};
