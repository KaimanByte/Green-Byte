CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"region_code" varchar(50) PRIMARY KEY NOT NULL,
	"country" varchar(100) NOT NULL,
	"region_name" varchar(100) NOT NULL,
	"city" varchar(100),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"carbon_intensity" double precision NOT NULL,
	"renewable_share_percent" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"codigo_regiao" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ativo' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" varchar(100) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"cpu_percent" double precision NOT NULL,
	"memory_gb" double precision NOT NULL,
	"disk_gb" double precision NOT NULL,
	"energy_kwh" double precision NOT NULL,
	"co2_emissions" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_interval_seconds" integer DEFAULT 300 NOT NULL,
	"cpu_max_watts" double precision DEFAULT 150 NOT NULL,
	"ram_watts_per_gb" double precision DEFAULT 3 NOT NULL,
	"disk_watts_per_gb" double precision DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_codigo_regiao_regions_region_code_fk" FOREIGN KEY ("codigo_regiao") REFERENCES "public"."regions"("region_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;