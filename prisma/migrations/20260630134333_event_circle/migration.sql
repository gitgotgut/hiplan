-- Associate events with a Circle for OPEN visibility
ALTER TABLE "Event" ADD COLUMN "circleId" TEXT;
CREATE INDEX "Event_circleId_idx" ON "Event"("circleId");
