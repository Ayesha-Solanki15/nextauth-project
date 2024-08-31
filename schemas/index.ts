import { PassThrough } from "stream";
import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
  name: z.string().min(1, { message: "Name is required" }),
});

// it's good to not set the limit of password during login because it could be a case where we have pre-existing users that have a password that is smaller than the limit, we may set it for register

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
});
