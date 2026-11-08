CREATE TABLE "content_abuse_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"ip" text,
	"reason" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_content_access" (
	"subject" text NOT NULL,
	"day" text NOT NULL,
	"kind" text NOT NULL,
	"question_n" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_content_access_subject_day_kind_question_n_pk" PRIMARY KEY("subject","day","kind","question_n")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counter" (
	"key" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_counter_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE INDEX "content_abuse_event_created_idx" ON "content_abuse_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_abuse_event_user_idx" ON "content_abuse_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_content_access_day_idx" ON "exam_content_access" USING btree ("day");--> statement-breakpoint
CREATE INDEX "rate_limit_counter_window_idx" ON "rate_limit_counter" USING btree ("window_start");