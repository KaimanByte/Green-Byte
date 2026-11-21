CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_email" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"target" varchar(255),
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "collection_interval_seconds" SET DEFAULT 30;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "cpu_max_watts" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "ram_watts_per_gb" SET DEFAULT 0.375;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "disk_watts_per_gb" SET DEFAULT 0.01;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'operator' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "network_watts_per_gb" double precision DEFAULT 0.02 NOT NULL;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
-- Quem já existia tinha acesso total (não havia papéis): continua administrador.
UPDATE "users" SET "role" = 'admin';--> statement-breakpoint
-- A tabela settings nunca foi lida pelo sistema. Se existir uma linha ainda com os
-- padrões antigos (que não eram os do modelo do desafio), ela passa a usar os do modelo.
UPDATE "settings"
SET "collection_interval_seconds" = 30, "cpu_max_watts" = 100, "ram_watts_per_gb" = 0.375, "disk_watts_per_gb" = 0.01
WHERE "collection_interval_seconds" = 300 AND "cpu_max_watts" = 150 AND "ram_watts_per_gb" = 3 AND "disk_watts_per_gb" = 1;
