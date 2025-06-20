import { storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Platform } from "react-native";

// Improve error handling in upload function
export const createUploadTask = async (file, path, onProgress) => {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  if (!path) {
    throw new Error("No storage path specified");
  }

  try {
    // Create reference to the file location in Firebase Storage
    const storageRef = ref(storage, path);

    // For web platform, handle Blob or File objects
    if (Platform.OS === "web") {
      // Log file details for debugging
      console.log("Web upload - file type:", typeof file, file instanceof Blob);

      // Handle file upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      // Set up progress monitoring
      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error("Storage error:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadURL, canceled: false });
            } catch (urlError) {
              reject(urlError);
            }
          }
        );
      });
    } else {
      // For native platforms (iOS/Android)
      if (!file.uri) {
        throw new Error("File URI is missing");
      }

      // For native platforms, handle file URI
      const fetchResponse = await fetch(file.uri);
      const fileObj = await fetchResponse.blob();

      // Create and start the upload task
      const uploadTask = uploadBytesResumable(storageRef, fileObj);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
            onProgress(progress);
          },
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, canceled: false });
          }
        );
      });
    }
  } catch (error) {
    console.error("Error in createUploadTask:", error);
    throw error;
  }
};
