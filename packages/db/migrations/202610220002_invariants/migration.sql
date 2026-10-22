ALTER TABLE "Visit" ADD CONSTRAINT "visit_positive_duration" CHECK ("endAt" > "startAt");
ALTER TABLE "Reservation" ADD CONSTRAINT "reservation_positive_duration" CHECK ("endAt" > "startAt");
ALTER TABLE "Availability" ADD CONSTRAINT "availability_positive_duration" CHECK ("endAt" > "startAt");
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "document_positive_size" CHECK (size > 0);
CREATE OR REPLACE FUNCTION protect_immutable_records() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Immutable record cannot be changed';
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER immutable_snapshot BEFORE UPDATE OR DELETE ON "Snapshot" FOR EACH ROW EXECUTE FUNCTION protect_immutable_records();
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON "Audit" FOR EACH ROW EXECUTE FUNCTION protect_immutable_records();
CREATE TRIGGER immutable_decision BEFORE UPDATE OR DELETE ON "Decision" FOR EACH ROW EXECUTE FUNCTION protect_immutable_records();
CREATE OR REPLACE FUNCTION protect_published_workflow() RETURNS trigger AS $$
BEGIN
  IF OLD.state IN ('PUBLISHED', 'RETIRED') AND (NEW.config IS DISTINCT FROM OLD.config OR NEW.name IS DISTINCT FROM OLD.name OR NEW.version IS DISTINCT FROM OLD.version) THEN
    RAISE EXCEPTION 'Published workflow content is immutable';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER immutable_workflow BEFORE UPDATE ON "Workflow" FOR EACH ROW EXECUTE FUNCTION protect_published_workflow();
