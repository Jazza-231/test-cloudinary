import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";

export function generateSignature(params: object, secret: string) {
	const stringToEncode = (() => {
		let param;
		const tempParams = [];

		for (const key in params) {
			if (Object.prototype.hasOwnProperty.call(params, key)) {
				const element = params[key as keyof typeof params];
				if (element) {
					param = key.toString() + "=" + String(element);
					tempParams.push(param);
				}
			}
		}

		return tempParams.sort().join("&") + secret;
	})();

	return encodeHexLowerCase(sha1(new TextEncoder().encode(stringToEncode)));
}
