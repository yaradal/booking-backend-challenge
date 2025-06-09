
ALTER TABLE "Booking" ADD COLUMN "checkOutDate" DATETIME;

-- Backfill existing data
UPDATE "Booking"
SET "checkOutDate" = datetime("checkInDate", '+' || "numberOfNights" || ' days');

CREATE INDEX "idx_booking_unit_dates" ON "Booking" ("unitID", "checkInDate", "checkOutDate");
CREATE INDEX "idx_booking_guest" ON "Booking" ("guestName");