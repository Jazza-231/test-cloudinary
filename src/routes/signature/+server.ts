import { CLOUDINARY_SECRET } from "$env/static/private";
import { generateSignature } from "$lib/cloudinary/signature";
import { json } from "@sveltejs/kit";

export const POST = async ({ request }) => {
	const timestamp = Math.round(new Date().getTime() / 1000).toString();
	const dataToSign = (await request.json()).dataToSign;

	const signature = generateSignature({ ...dataToSign, timestamp }, CLOUDINARY_SECRET);

	return json({
		signature,
		signedData: { ...dataToSign, timestamp },
	});
};
