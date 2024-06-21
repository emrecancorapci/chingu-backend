CREATE SCHEMA "task_manager";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_manager"."priority" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_manager"."task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" varchar,
	"priority" "task_manager"."priority",
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"completed_at" bigint,
	"due_date" bigint,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_manager"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(128) NOT NULL,
	"password" varchar(128) NOT NULL,
	"username" varchar(128) NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_manager"."task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "task_manager"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
