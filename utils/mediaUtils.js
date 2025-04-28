import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import {
  createUploadTask,
  cancelActiveUpload,
  hasActiveUpload,
} from "./storageUtils";

/**
 * Request camera permissions
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission required",
      "Camera access is needed to take photos.",
      [{ text: "OK" }]
    );
    return false;
  }
  return true;
};

/**
 * Request media library permissions
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission required",
      "Media library access is needed to select photos.",
      [{ text: "OK" }]
    );
    return false;
  }
  return true;
};

/**
 * Open camera to take a photo
 * @returns {Promise<Object|null>} - Image object or null if canceled
 */
export const takePicture = async () => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images, // Updated from MediaTypeOptions
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;

    // Return first selected asset (there should only be one when using camera)
    return result.assets[0];
  } catch (error) {
    console.error("Error taking picture:", error);
    return null;
  }
};

/**
 * Open image picker to select from gallery
 * @returns {Promise<Object|null>} - Image object or null if canceled
 */
export const pickImage = async () => {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images, // Updated from MediaTypeOptions
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return null;

    // Return first selected asset
    return result.assets[0];
  } catch (error) {
    console.error("Error picking image:", error);
    return null;
  }
};

/**
 * Open document picker to select a file
 * @returns {Promise<Object|null>} - Document object or null if canceled
 */
export const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*", // All file types
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    // Return the first asset (should only be one)
    return result.assets[0];
  } catch (error) {
    console.error("Error picking document:", error);
    return null;
  }
};

/**
 * Upload a file to storage and get the download URL
 * @param {Object} file - The file to upload
 * @param {string} userId - Current user ID
 * @param {string} chatId - ID of the chat room
 * @param {Function} progressCallback - Callback function for progress updates
 * @returns {Promise<{url: string|null, canceled: boolean}>}
 */
export const uploadMedia = async (
  file,
  userId,
  chatId,
  progressCallback = () => {}
) => {
  try {
    // Determine if file is an image or a document
    const isImage =
      file.uri &&
      (file.type?.startsWith("image/") ||
        file.uri.match(/\.(jpg|jpeg|png|gif)$/i));

    // Create path for the file
    const timestamp = new Date().getTime();
    const fileName = file.name || `${timestamp}.${file.uri.split(".").pop()}`;
    const type = isImage ? "images" : "files";
    const path = `chats/${chatId}/${type}/${userId}_${timestamp}_${fileName}`;

    // Upload the file and get result
    const result = await createUploadTask(file, path, progressCallback);

    return result;
  } catch (error) {
    console.error("Error uploading media:", error);
    return { url: null, canceled: false };
  }
};

/**
 * Cancel the ongoing upload task if exists
 */
export const cancelUpload = cancelActiveUpload;

/**
 * Check if there's an upload in progress
 * @returns {boolean}
 */
export const hasUploadInProgress = hasActiveUpload;
