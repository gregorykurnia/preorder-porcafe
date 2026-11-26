CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"client_key" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"slot" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"total" integer NOT NULL,
	"paid_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code_unique" UNIQUE("code"),
	CONSTRAINT "orders_client_key_unique" UNIQUE("client_key")
);
