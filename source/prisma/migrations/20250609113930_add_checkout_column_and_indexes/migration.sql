-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking"
(
    "id"             INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestName"      TEXT     NOT NULL,
    "unitID"         TEXT     NOT NULL,
    "checkInDate"    DATETIME NOT NULL,
    "numberOfNights" INTEGER  NOT NULL,
    "checkOutDate"   DATETIME NOT NULL
);
INSERT INTO "new_Booking" ("checkInDate", "guestName", "id", "numberOfNights", "unitID", "checkOutDate")
SELECT "checkInDate", "guestName", "id", "numberOfNights", "unitID",
       "checkInDate" + "numberOfNights" * 86400000 as "checkOutDate"
FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "idx_booking_unit_dates" ON "Booking"("unitID", "checkInDate", "checkOutDate");
CREATE INDEX "idx_booking_guest" ON "Booking"("guestName", "checkInDate", "checkOutDate");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON ;