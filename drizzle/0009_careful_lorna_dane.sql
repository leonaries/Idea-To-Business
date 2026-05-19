CREATE TABLE "company" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"tagline" text,
	"description" text,
	"type" varchar(64) NOT NULL,
	"domains" text DEFAULT '' NOT NULL,
	"founded_year" integer,
	"country" varchar(80),
	"city" varchar(80),
	"employee_range" varchar(64),
	"funding_stage" varchar(64),
	"total_funding" text,
	"website" text,
	"social_links" text,
	"tags" text DEFAULT '' NOT NULL,
	"status" varchar(32) DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inquiry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"source_type" varchar(32) DEFAULT 'general' NOT NULL,
	"source_id" text,
	"name" text NOT NULL,
	"company_name" text,
	"email" text NOT NULL,
	"phone" varchar(64),
	"industry" varchar(80),
	"scenario" text NOT NULL,
	"budget_range" varchar(64),
	"message" text,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"cover_image" text,
	"images" text DEFAULT '' NOT NULL,
	"company_id" text,
	"category" varchar(64) NOT NULL,
	"sub_category" varchar(80),
	"industries" text DEFAULT '' NOT NULL,
	"capabilities" text DEFAULT '' NOT NULL,
	"specs" text,
	"price_range" varchar(64),
	"description" text,
	"official_url" text,
	"lifecycle_status" varchar(32) DEFAULT 'available' NOT NULL,
	"publish_status" varchar(32) DEFAULT 'published' NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vendor_application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(64),
	"website" text,
	"product_types" text DEFAULT '' NOT NULL,
	"cooperation_intent" text,
	"message" text,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_application" ADD CONSTRAINT "vendor_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_slug_idx" ON "company" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "company_status_idx" ON "company" USING btree ("status");--> statement-breakpoint
CREATE INDEX "company_type_idx" ON "company" USING btree ("type");--> statement-breakpoint
CREATE INDEX "inquiry_status_idx" ON "inquiry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inquiry_created_at_idx" ON "inquiry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inquiry_source_idx" ON "inquiry" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_company_idx" ON "product" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "product_publish_status_idx" ON "product" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "vendor_application_status_idx" ON "vendor_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_application_created_at_idx" ON "vendor_application" USING btree ("created_at");