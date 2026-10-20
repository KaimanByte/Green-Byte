ALTER TABLE "services" RENAME COLUMN "nome" TO "name";--> statement-breakpoint
ALTER TABLE "services" RENAME COLUMN "codigo_regiao" TO "region_code";--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_codigo_regiao_regions_region_code_fk";
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_region_code_regions_region_code_fk" FOREIGN KEY ("region_code") REFERENCES "public"."regions"("region_code") ON DELETE no action ON UPDATE no action;