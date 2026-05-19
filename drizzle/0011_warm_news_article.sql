CREATE TABLE IF NOT EXISTS "news_article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"source_name" text,
	"source_url" text,
	"cover_image" text,
	"category" varchar(64) NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"related_product_ids" text DEFAULT '' NOT NULL,
	"related_company_ids" text DEFAULT '' NOT NULL,
	"published_at" timestamp,
	"publish_status" varchar(32) DEFAULT 'draft' NOT NULL,
	"hot_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_article_slug_idx" ON "news_article" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_article_status_idx" ON "news_article" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_article_published_at_idx" ON "news_article" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_article_category_idx" ON "news_article" USING btree ("category");
