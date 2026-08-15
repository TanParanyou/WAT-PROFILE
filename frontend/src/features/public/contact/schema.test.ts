import { test } from "node:test";
import assert from "node:assert/strict";
import { createContactSchema } from "./schema";

const messages = {
	required: "required",
	invalidEmail: "invalid email",
	nameLimit: "name too long",
	emailLimit: "email too long",
	subjectLimit: "subject too long",
	messageLimit: "message too long",
};

test("contact schema enforces Unicode limits and accepts an empty honeypot", () => {
	const schema = createContactSchema(messages);
	assert.equal(schema.safeParse({ name: "ก".repeat(121), email: "a@example.com", subject: "ถาม", message: "ข้อความ", website: "" }).success, false);
	assert.equal(schema.safeParse({ name: "Visitor", email: "a@example.com", subject: "Visit", message: "Hello", website: "" }).success, true);
});

test("contact schema counts emoji as one code point", () => {
	const schema = createContactSchema(messages);
	const result = schema.safeParse({
		name: "Visitor",
		email: "a@example.com",
		subject: "Visit",
		message: "🙂".repeat(5000),
		website: "",
	});
	assert.equal(result.success, true);
});
