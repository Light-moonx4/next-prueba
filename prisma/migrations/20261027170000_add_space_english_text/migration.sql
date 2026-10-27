ALTER TABLE "Space"
  ADD COLUMN "nameEn" TEXT,
  ADD COLUMN "descriptionEn" TEXT;

UPDATE "Space"
SET "nameEn" = 'Coworking Desk 1', "descriptionEn" = 'Individual desk'
WHERE "name" = 'Coworking Desk 1';

UPDATE "Space"
SET "nameEn" = 'Alpha Meeting Room', "descriptionEn" = 'Meeting room for 8 people'
WHERE "name" = 'Sala de Juntas Alpha';

UPDATE "Space"
SET "nameEn" = 'Zen Private Booth', "descriptionEn" = 'Soundproof private booth'
WHERE "name" = 'Cabina Privada Zen';
