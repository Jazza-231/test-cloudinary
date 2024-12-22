<script lang="ts">
	import "../app.css";
	import { cloudinary } from "$lib/cloudinary";

	interface Image {
		id: string;
		name: string;
		arrayBuffer: ArrayBuffer;
		base64?: string;
		progress?: number;
		status?: "uploading" | "uploaded" | "failed";
		url?: string;
		folder?: string;
		cloudinaryId?: string;
		dimensions?: {
			width: number;
			height: number;
		};
	}

	let images: Image[] = $state([]);
	$inspect(images);

	function addImage(id: string, name: string, arrayBuffer: ArrayBuffer) {
		if (images.map((image) => image.id).indexOf(id) === -1) {
			images.push({ id, name, arrayBuffer });
		}
	}

	function updateImage(id: string, { ...args }: Partial<Image>) {
		const imageIndex = images.findIndex((image) => image.id === id);
		if (imageIndex !== -1) {
			images[imageIndex] = { ...images[imageIndex], ...args };
		}
	}

	function handleAddImages() {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.multiple = true;
		fileInput.accept = "image/*";

		fileInput.onchange = async () => {
			const files = Array.from(fileInput.files || []);
			console.log("🚀 ~ handleAddImages ~ files:", files);

			await handleFiles(files);
		};

		fileInput.click();
	}

	function handleDropImages(e: DragEvent) {
		e.preventDefault();
		const files = Array.from(e.dataTransfer?.files || []);
		console.log("🚀 ~ handleDropImages ~ files:", files);
		handleFiles(files);
	}

	async function handleFiles(files: File[]) {
		for (const file of files) {
			const id = crypto.randomUUID();

			addImage(id, file.name, await file.arrayBuffer());

			try {
				const reader = new FileReader();

				const imageData = await new Promise<string>((resolve, reject) => {
					reader.onload = () => {
						const imageData = reader.result as string;

						updateImage(id, { base64: imageData });

						resolve(imageData as string);
					};
					reader.onerror = reject;
					reader.readAsDataURL(file);
				});

				cloudinary
					.upload(imageData, "testing")
					.onProgress((progress) => {
						updateImage(id, { progress, status: "uploading" });
					})
					.onSuccess((result) => {
						updateImage(id, {
							url: result.url,
							cloudinaryId: result.public_id,
							dimensions: {
								width: result.width,
								height: result.height
							},
							status: "uploaded"
						});
					})
					.onError((error) => {
						console.error("Upload failed:", error);
						updateImage(id, { status: "failed" });
					})
					.start();
			} catch (error) {
				console.error("Upload failed:", error);
				updateImage(id, { status: "failed" });
			}
		}
	}
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<p>Don't upload anything you don't want me to see</p>

<button onclick={handleAddImages}>Add images</button>

<div
	class="drop"
	ondragover={(e) => {
		e.preventDefault();
	}}
	ondrop={handleDropImages}
	role="none"
></div>

<div class="images">
	{#each images as image}
		<div class="img-container">
			<span>
				{#if image.status === "uploading"}
					{image.progress}%
				{:else if image.status === "uploaded"}
					Done
				{:else}
					Pending
				{/if}
			</span>

			<img src={image.base64} alt={image.name} />
		</div>
	{/each}
</div>

<style>
	.images {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 1rem;
		margin-block: 2rem;

		.img-container {
			position: relative; /* Add this to contain the absolute span */
		}

		img {
			width: 100%;
			height: auto;
		}

		span {
			position: absolute;
			top: 0.75rem;
			left: 0.75rem;
			padding: 0.25rem 0.5rem; /* Add padding for better appearance */
			color: black;
			background-color: color-mix(in srgb, white 50%, transparent);
			border-radius: 0.25rem; /* Optional: adds rounded corners */
			box-shadow: rgba(0, 0, 0, 0.5) 0 0 2rem;
		}
	}

	.drop {
		width: 30rem;
		height: 20rem;
		border: lightblue dashed 2px;
		margin-block: 1rem;
	}
</style>
