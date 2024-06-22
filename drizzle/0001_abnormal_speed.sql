DO $$ BEGIN
 CREATE TYPE "task_manager"."role" AS ENUM('admin', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "task_manager"."user" ADD COLUMN "role" "task_manager"."role" NOT NULL;