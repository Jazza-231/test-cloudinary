import { CLOUDINARY_SECRET } from "$env/static/private";
import { PUBLIC_CLOUDINARY_KEY, PUBLIC_CLOUDINARY_NAME } from "$env/static/public";
import { json } from "@sveltejs/kit";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: PUBLIC_CLOUDINARY_NAME,
	api_key: PUBLIC_CLOUDINARY_KEY,
	api_secret: CLOUDINARY_SECRET,
});

export const POST = async () => {
	const timestamp = Math.round(new Date().getTime() / 1000);
	const paramsToSign = {
		timestamp,
		upload_preset: "testing",
		folder: "sa",
	};

	if (!cloudinary.config().api_secret) return new Response("No API secret");

	const signature = cloudinary.utils.api_sign_request(
		paramsToSign,
		cloudinary.config().api_secret as string,
	);

	console.log({
		cloudName: cloudinary.config().cloud_name,
		apiKey: cloudinary.config().api_key,
		apiSecret: cloudinary.config().api_secret,
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
