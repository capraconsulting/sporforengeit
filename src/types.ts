import {
	object,
	type Output,
	string,
	number,
	boolean,
	transform,
} from "valibot"; // 0.87 kB

export const MessageSchema = object({
	id: number(),
	content: string(),
	authorId: string(),
	scheduled: transform(number(), (value) => Boolean(value)),
	published: transform(number(), (value) => Boolean(value)),
	createdAt: transform(string(), (value) => new Date(value)),
});

export type Message = Output<typeof MessageSchema>; // { email: string; password: string }
