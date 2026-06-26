CREATE TYPE "public"."order_adjustment_status" AS ENUM('pending', 'confirmed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."order_adjustment_type" AS ENUM('additional_payment', 'refund');--> statement-breakpoint
CREATE TABLE "order_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"type" "order_adjustment_type" NOT NULL,
	"status" "order_adjustment_status" DEFAULT 'pending' NOT NULL,
	"previous_total" numeric(10, 2) NOT NULL,
	"new_total" numeric(10, 2) NOT NULL,
	"difference" numeric(10, 2) NOT NULL,
	"payment_id" text,
	"operation" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "order_adjustments" ADD CONSTRAINT "order_adjustments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_adjustments" ADD CONSTRAINT "order_adjustments_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_adjustments" ADD CONSTRAINT "order_adjustments_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;