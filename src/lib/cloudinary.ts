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

	constructor(imageData: string, uploadPreset: string) {
		this.imageData = imageData;
		this.uploadPreset = uploadPreset;
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

			const base64Data = this.imageData.split(",")[1];
			formData.append("file", "data:image/png;base64," + base64Data);

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
					this.errorCallback?.({ ...(error as Error), http_code: xhr.status });
					reject(error);
				}
			};

			xhr.upload.addEventListener("progress", (e) => {
				const progress = Math.round((e.loaded * 100.0) / e.total);
				this.progressCallback?.(progress);
			});

			// It's ok to leak this. There is no money associated, and it is a new account I just made.
			xhr.open("post", `https://api.cloudinary.com/v1_1/dgxy4yhhp/auto/upload`);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(formData);
		});
	}
}

export const cloudinary = {
	upload: (imageData: string, uploadPreset: string) =>
		new CloudinaryUploader(imageData, uploadPreset)
};
