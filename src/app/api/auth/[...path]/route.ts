import { auth } from "@/server/auth";

export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
