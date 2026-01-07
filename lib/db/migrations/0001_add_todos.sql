CREATE TABLE IF NOT EXISTS "todo_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"time" text,
	"responsible" text NOT NULL,
	"repeat_pattern" text DEFAULT 'weekly' NOT NULL,
	"interval_weeks" integer DEFAULT 1,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_plan_day_id" uuid NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"time" text,
	"responsible" text NOT NULL,
	"completed" boolean DEFAULT false,
	"position" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'adhoc' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "todos_template_id_week_plan_day_id_unique" UNIQUE("template_id","week_plan_day_id")
);
--> statement-breakpoint
ALTER TABLE "dinners" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "week_plan_days" ADD COLUMN "dinner_icon_snapshot" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "todos" ADD CONSTRAINT "todos_week_plan_day_id_week_plan_days_id_fk" FOREIGN KEY ("week_plan_day_id") REFERENCES "public"."week_plan_days"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "todos" ADD CONSTRAINT "todos_template_id_todo_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."todo_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
