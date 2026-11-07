CREATE TABLE "exam_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_n" integer NOT NULL,
	"question_serial" text,
	"author_id" text NOT NULL,
	"parent_id" integer,
	"body" text NOT NULL,
	"suggested_answer" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "exam_comment" ADD CONSTRAINT "exam_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_comment_question_idx" ON "exam_comment" USING btree ("question_n");