DO $$ BEGIN
 CREATE TYPE "task_manager"."status" AS ENUM('todo', 'working', 'finished');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_manager"."project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" varchar,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_manager"."task" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "task_manager"."task" ADD COLUMN "status" "task_manager"."status" DEFAULT 'todo' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_manager"."project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "task_manager"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_manager"."task" ADD CONSTRAINT "task_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "task_manager"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
