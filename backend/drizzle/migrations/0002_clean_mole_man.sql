ALTER TABLE "users" RENAME COLUMN "senha_hash" TO "hash_password";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "criado_em" TO "created_at";