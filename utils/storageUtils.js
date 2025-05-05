import { storage } from "../firebaseConfig";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

let activeUploadTask = null;

/**
 * Creates a cancelable upload task and starts the upload
 */
export const createUploadTask = async (
  file,
  path,
  progressCallback = () => {}
) => {
  try {
    // Create storage reference
    const storageRef = ref(storage, path);

    // Get blob data
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Create and store the upload task globally
    activeUploadTask = uploadBytesResumable(storageRef, blob);

    // Return a promise that resolves with both the download URL and handles cancellation
    return new Promise((resolve, reject) => {
      activeUploadTask.on(
        "state_changed",
        (snapshot) => {
          // Report upload progress
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          progressCallback(progress);
        },
        (error) => {
          console.log("Upload error code:", error.code);
          if (error.code === "storage/canceled") {
            console.log("Upload was canceled");
            resolve({ canceled: true });
          } else {
            console.error("Upload error:", error);
            reject(error);
          }
        },
        async () => {
          // Upload completed, get download URL
          try {
            const downloadURL = await getDownloadURL(
              activeUploadTask.snapshot.ref
            );
            console.log("Upload completed successfully");
            resolve({ url: downloadURL, canceled: false });
          } catch (error) {
            console.error("Error getting download URL:", error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in createUploadTask:", error);
    throw error;
  }
};

/**
 * Cancels the active upload and cleans up resources
 */
export const cancelActiveUpload = async () => {
  if (!activeUploadTask) {
    console.log("No active upload to cancel");
    return false;
  }

  try {
    // Cancel the upload
    activeUploadTask.cancel();

    // Try to delete the partially uploaded file
    try {
      const fileRef = activeUploadTask.snapshot.ref;
      await deleteObject(fileRef);
      console.log("Partial file deleted");
    } catch (e) {
      console.log("Could not delete partial file:", e.message);
    }

    // Clear the active task
    activeUploadTask = null;
    console.log("Upload canceled successfully");
    return true;
  } catch (error) {
    console.error("Error canceling upload:", error);
    return false;
  }
};

/**
 * Check if there's an active upload
 */
export const hasActiveUpload = () => {
  return activeUploadTask !== null;
};
