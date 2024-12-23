import { PUBLIC_CLOUDINARY_KEY, PUBLIC_CLOUDINARY_NAME } from "$env/static/public";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
// Is it entirely a terrible idea to import a package just for the types?

type ProgressCallback = (progress: number) => void;
type SuccessCallback = (result: UploadApiResponse) => void;
type ErrorCallback = (error: UploadApiErrorResponse) => void;

class CloudinaryUploader {
	private progressCallback?: ProgressCallback;
	private successCallback?: SuccessCallback;
	private errorCallback?: ErrorCallback;
	private imageData: string;
	private uploadPreset: string;
	private signature: string;
	private timestamp: number;
	private folder: string;

	constructor(
		imageData: string,
		uploadPreset: string,
		signature: string,
		timestamp: number,
		folder: string,
	) {
		this.imageData = imageData;
		this.uploadPreset = uploadPreset;
		this.signature = signature;
		this.timestamp = timestamp;
		this.folder = folder;
	}

	onProgress(callback: ProgressCallback) {
		this.progressCallback = callback;
		return this;
	}

	onSuccess(callback: SuccessCallback) {
		this.successCallback = callback;
		return this;
	}

	onError(callback: ErrorCallback) {
		this.errorCallback = callback;
		return this;
	}

	start() {
		return new Promise((resolve, reject) => {
			const formData = new FormData();

			formData.append("upload_preset", this.uploadPreset);
			formData.append("file", this.imageData);
			formData.append("signature", this.signature);
			formData.append("timestamp", this.timestamp.toString());
			formData.append("folder", this.folder);

			if (!PUBLIC_CLOUDINARY_KEY) return reject(new Error("No API key"));
			formData.append("api_key", PUBLIC_CLOUDINARY_KEY);

			const xhr = new XMLHttpRequest();

			xhr.onreadystatechange = () => {
				if (xhr.readyState !== 4) return;

				if (xhr.status !== 200) {
					const error = new Error("Upload failed");
					this.errorCallback?.({ ...error, http_code: xhr.status });
					reject(error);
					return;
				}

				try {
					const res = JSON.parse(xhr.responseText);
					if (!res || !res.public_id) {
						const error = new Error("Invalid response from Cloudinary");
						this.errorCallback?.({ ...error, http_code: xhr.status });
						reject(error);
						return;
					}

					this.successCallback?.(res);
					resolve(res);
				} catch (error) {
					this.errorCallback?.({
						...(error as Error),
						http_code: xhr.status,
						message: (error as Error).message,
					});
					reject(error);
				}
			};

			xhr.upload.addEventListener("progress", (e) => {
				const progress = Math.round((e.loaded * 100.0) / e.total);
				this.progressCallback?.(progress);
			});

			// It's ok to leak this. There is no money associated, and it is a new account I just made.
			xhr.open("post", `https://api.cloudinary.com/v1_1/${PUBLIC_CLOUDINARY_NAME}/auto/upload`);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(formData);
		});
	}
}

export const cloudinary = {
	upload: (
		imageData: string,
		uploadPreset: string,
		signature: string,
		timestamp: number,
		folder: string,
	) => new CloudinaryUploader(imageData, uploadPreset, signature, timestamp, folder),
};
