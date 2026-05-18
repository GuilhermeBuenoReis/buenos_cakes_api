DROP INDEX "product_fillings_product_id_label_unique";--> statement-breakpoint
DROP INDEX "product_fillings_default_unique";--> statement-breakpoint
DROP INDEX "product_sizes_product_id_code_unique";--> statement-breakpoint
DROP INDEX "product_sizes_default_unique";--> statement-breakpoint
ALTER TABLE "product_fillings" ADD CONSTRAINT "product_fillings_label_unique" UNIQUE("label");--> statement-breakpoint
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_code_unique" UNIQUE("code");