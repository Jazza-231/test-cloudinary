import { CLOUDINARY_SECRET } from "$env/static/private";
import { PUBLIC_CLOUDINARY_KEY, PUBLIC_CLOUDINARY_NAME } from "$env/static/public";
import { generateSignature } from "$lib/cloudinary/signature";
import { json } from "@sveltejs/kit";

export const POST = async () => {
	const timestamp = Math.round(new Date().getTime() / 1000);
	const paramsToSign = {
		timestamp,
		upload_preset: "testing",
		folder: "sa",
	};

	if (!CLOUDINARY_SECRET) return new Response("No API secret");

	const signature = generateSignature(paramsToSign, CLOUDINARY_SECRET);

	console.log({
		cloudName: PUBLIC_CLOUDINARY_NAME,
		apiKey: PUBLIC_CLOUDINARY_KEY,
		apiSecret: CLOUDINARY_SECRET,
		signature,
		paramsToSign,
	});

	return json({
		timestamp,
		signature,
		folder: paramsToSign.folder,
		upload_preset: paramsToSign.upload_preset,
	});
};
