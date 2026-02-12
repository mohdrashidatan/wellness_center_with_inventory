const { z } = require("zod");

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .min(1, "Email is required")
    .max(255, "Email is too long"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(128, "Password is too long"),
});

const registrationSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .min(1, "Email is required")
      .max(255, "Email is too long"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long")
      .max(128, "Password is too long"),
    confirmPassword: z
      .string({ required_error: "Confirm Password is required" })
      .min(1, "Confirm Password is required"),
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(255, "Name is too long"),
    phone: z
      .string()
      .trim()
      .max(20, "Phone number is too long")
      .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Invalid phone number format")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

module.exports = {
  loginSchema,
  registrationSchema,
};
