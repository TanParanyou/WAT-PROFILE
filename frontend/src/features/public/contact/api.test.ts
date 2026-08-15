import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";
import type { AxiosAdapter } from "axios";
import { publicApi } from "@/services/publicService";
import { submitPublicContact } from "./api";
import { PublicContactApiError } from "./types";

const validInput = {
	name: "Visitor",
	email: "visitor@example.com",
	subject: "Visit",
	message: "Hello",
	locale: "en" as const,
	website: "",
};

afterEach(() => {
	publicApi.defaults.adapter = undefined;
});

test("contact API maps backend fields and rate-limit metadata", async () => {
	const adapter: AxiosAdapter = async (config) => {
		throw new AxiosError("rate limited", AxiosError.ERR_BAD_REQUEST, config, null, {
			data: {
				success: false,
				error: "Too many",
				code: "CONTACT_RATE_LIMITED",
				fields: { email: "Invalid email" },
				trace_id: "trace-1",
			},
			status: 429,
			statusText: "Too Many Requests",
			headers: { "retry-after": "60" },
			config,
		});
	};
	publicApi.defaults.adapter = adapter;

	await assert.rejects(
		() => submitPublicContact(validInput),
		(error: unknown) => {
			assert.equal(error instanceof PublicContactApiError, true);
			if (!(error instanceof PublicContactApiError)) return false;
			assert.equal(error.code, "CONTACT_RATE_LIMITED");
			assert.equal(error.retryAfterSeconds, 60);
			assert.equal(error.fields.email, "Invalid email");
			assert.equal(error.traceId, "trace-1");
			return true;
		},
	);
});

test("contact API accepts the generic success envelope", async () => {
	publicApi.defaults.adapter = async (config) => ({
		data: { success: true, message: "Message received." },
		status: 201,
		statusText: "Created",
		headers: {},
		config,
	});
	await submitPublicContact(validInput);
});
