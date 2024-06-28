ALTER TABLE "task_manager"."task" DROP CONSTRAINT "task_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "task_manager"."task" DROP CONSTRAINT "task_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "task_manager"."user" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_manager"."task" ADD CONSTRAINT "task_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "task_manager"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "task_manager"."task" DROP COLUMN IF EXISTS "user_id";