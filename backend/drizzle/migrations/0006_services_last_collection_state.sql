ALTER TABLE "services" ADD COLUMN "last_collection_state" varchar(20);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "last_collection_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "last_collection_error" varchar(500);