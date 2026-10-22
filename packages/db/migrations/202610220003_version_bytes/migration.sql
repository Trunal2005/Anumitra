CREATE OR REPLACE FUNCTION protect_document_bytes() RETURNS trigger AS $$
BEGIN
  IF NEW."documentId" IS DISTINCT FROM OLD."documentId" OR NEW.number IS DISTINCT FROM OLD.number OR NEW."storageKey" IS DISTINCT FROM OLD."storageKey" OR NEW.hash IS DISTINCT FROM OLD.hash OR NEW.mime IS DISTINCT FROM OLD.mime OR NEW.size IS DISTINCT FROM OLD.size OR NEW."validUntil" IS DISTINCT FROM OLD."validUntil" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'Immutable document version metadata cannot be changed';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER immutable_document_bytes BEFORE UPDATE ON "DocumentVersion" FOR EACH ROW EXECUTE FUNCTION protect_document_bytes();
