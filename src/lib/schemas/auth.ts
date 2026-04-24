import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Au moins 8 caractères'),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Au moins 8 caractères'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Email invalide'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
