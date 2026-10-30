import { z } from "zod";
const sourceSchema = z
  .object({
    url: z.url(),
    publisher: z.string(),
    documentDate: z.iso.date(),
    academicYear: z.string(),
    location: z.string(),
    retrievedOn: z.iso.date(),
    humanReviewStatus: z.literal("TEAM_HUMAN_REVIEW_PENDING"),
    verification: z.literal("TEXT_AND_RENDERED_PAGE_CROSS_CHECKED"),
    extractionMethod: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    redistribution: z.string(),
  })
  .strict();
const factSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    source: sourceSchema,
  })
  .strict();
const profileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    kind: z.literal("PUBLIC_REFERENCE"),
    academicYear: z.string(),
    readOnly: z.literal(true),
    identityUrl: z.url(),
    facts: z.array(factSchema),
    coverage: z.string(),
    warning: z.string(),
  })
  .strict();
type Source = z.infer<typeof sourceSchema>;
function profile(
  id: string,
  name: string,
  identityUrl: string,
  source: Omit<
    Source,
    | "location"
    | "retrievedOn"
    | "humanReviewStatus"
    | "verification"
    | "extractionMethod"
    | "redistribution"
  >,
  facts: [string, string, string | number][],
) {
  const provenance: Source = {
    ...source,
    location: "PDF page 1: identity table and 2025–26 intake columns",
    retrievedOn: "2026-10-29",
    humanReviewStatus: "TEAM_HUMAN_REVIEW_PENDING",
    verification: "TEXT_AND_RENDERED_PAGE_CROSS_CHECKED",
    extractionMethod:
      "Local PyMuPDF text extraction and agent visual comparison of rendered page 1; no paid OCR or LLM service",
    redistribution:
      "Publisher link and non-personal facts only. No PDF or page-image redistribution permission established. Analysis copies stay private/ignored; checksum is byte integrity, not authenticity.",
  };
  return profileSchema.parse({
    id,
    name,
    identityUrl,
    kind: "PUBLIC_REFERENCE",
    academicYear: source.academicYear,
    readOnly: true,
    facts: facts.map(([key, label, value]) => ({
      key,
      label,
      value,
      source: provenance,
    })),
    coverage:
      "Selected published facts and two undergraduate courses; not the full approved course list.",
    warning:
      "Historical 2025–26 source only. This does not establish 2026–27 approval, current compliance or an authorized AICTE connection. Team human sign-off remains pending.",
  });
}
export const publicInstitutionProfiles = Object.freeze([
  profile(
    "public-vit-2025-26",
    "Vidyalankar Institute of Technology",
    "https://vit.edu.in/disclosures/",
    {
      url: "https://vit.edu.in/wp-content/uploads/2026/01/EOA_VIT-2025-26-1.pdf",
      publisher:
        "Vidyalankar Institute of Technology; institution-hosted AICTE EoA",
      documentDate: "2025-03-20",
      academicYear: "2025-26",
      sha256:
        "6789ff31a4bc0ce211af01539cc1f4934f4fbc5d3c0d32068dc593eb72ea7422",
    },
    [
      [
        "institutionName",
        "Published institution name",
        "VIDYALANKAR INSTITUTE OF TECHNOLOGY",
      ],
      ["permanentId", "AICTE permanent ID", "1-14068819"],
      ["academicYear", "Academic year covered", "2025-26"],
      ["region", "Source-specific region", "Western"],
      [
        "programme",
        "Programme / level",
        "Engineering and Technology / Undergraduate",
      ],
      ["course1", "Published course 1", "Biomedical Engineering"],
      ["intake1", "Course 1 approved intake · 2025–26", 60],
      ["course2", "Published course 2", "Computer Engineering"],
      ["intake2", "Course 2 approved intake · 2025–26", 180],
      [
        "letterReference",
        "Published document reference",
        "Western/1-44642258421/2025/EOA",
      ],
    ],
  ),
  profile(
    "public-djsce-2025-26",
    "Dwarkadas J. Sanghvi College of Engineering",
    "https://www.djsce.ac.in/",
    {
      url: "https://www.djsce.ac.in/docs/Mandatory/EOA%20Report%202025-26.PDF",
      publisher:
        "Dwarkadas J. Sanghvi College of Engineering; institution-hosted AICTE EoA",
      documentDate: "2025-01-03",
      academicYear: "2025-26",
      sha256:
        "dea4da911d07b504e29ff6643ed6d7ce5497aa2da835ff369415857c801dc717",
    },
    [
      [
        "institutionName",
        "Published institution name",
        "SHRI VILE PARLE KELAVANI MANDAL'S DWARKADAS J. SANGHVI COLLEGE OF ENGINEERING",
      ],
      ["permanentId", "AICTE permanent ID", "1-12053991"],
      ["academicYear", "Academic year covered", "2025-26"],
      ["region", "Source-specific region", "Western"],
      [
        "programme",
        "Programme / level",
        "Engineering and Technology / Undergraduate",
      ],
      [
        "course1",
        "Published course 1",
        "Artificial Intelligence (AI) and Data Science",
      ],
      ["intake1", "Course 1 approved intake · 2025–26", 60],
      [
        "course2",
        "Published course 2",
        "Artificial Intelligence and Machine Learning",
      ],
      ["intake2", "Course 2 approved intake · 2025–26", 120],
      [
        "letterReference",
        "Published document reference",
        "Western/1-44642349205/2025/EOA",
      ],
    ],
  ),
  profile(
    "public-adcet-2025-26",
    "Annasaheb Dange College of Engineering and Technology, Ashta",
    "https://www.adcet.ac.in/",
    {
      url: "https://www.adcet.ac.in/files/approvals/aicte/25-EOA_Report_2025-26.pdf",
      publisher:
        "Annasaheb Dange College of Engineering and Technology, Ashta; institution-hosted AICTE EoA",
      documentDate: "2025-04-10",
      academicYear: "2025-26",
      sha256:
        "bd1c6ad89ad76797242512ac9e3c6601a22d3a1ed4b6a6e901952275eec65a7a",
    },
    [
      [
        "institutionName",
        "Published institution name",
        "ANNASAHEB DANGE COLLEGE OF ENGINEERING AND TECHNOLOGY, ASHTA",
      ],
      ["permanentId", "AICTE permanent ID", "1-4318091"],
      ["academicYear", "Academic year covered", "2025-26"],
      ["region", "Source-specific region", "Western"],
      [
        "programme",
        "Programme / level",
        "Engineering and Technology / Undergraduate",
      ],
      ["course1", "Published course 1", "Aeronautical Engineering"],
      ["intake1", "Course 1 approved intake · 2025–26", 60],
      [
        "course2",
        "Published course 2",
        "Artificial Intelligence (AI) and Data Science",
      ],
      ["intake2", "Course 2 approved intake · 2025–26", 60],
      [
        "letterReference",
        "Published document reference",
        "Western/1-44643132772/2025/EOA",
      ],
    ],
  ),
]);
