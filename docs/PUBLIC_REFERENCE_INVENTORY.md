# Public reference collection — source review 29 October 2026

This read-only collection is separate from the operational Institution/Application tables, workflow simulations and future authorized pilot data. It contributes zero cases/tasks to dashboards. It imports no approvals, decisions, permissions, visits, documents or compliance findings. Institution identity was checked against publisher pages and the identity tables of the institution-hosted PDFs. AICTE authenticity/current status was not independently certified.

| Profile | Historical year / document date | Permanent ID / source-specific region | Selected page-one course and intake examples | Publisher source |
|---|---|---|---|---|
| Vidyalankar Institute of Technology | 2025–26 / 20 March 2025 | 1-14068819 / Western | Biomedical Engineering: 60; Computer Engineering: 180 | [EoA, page 1](https://vit.edu.in/wp-content/uploads/2026/01/EOA_VIT-2025-26-1.pdf), [disclosure/identity page](https://vit.edu.in/disclosures/) |
| Dwarkadas J. Sanghvi College of Engineering | 2025–26 / 3 January 2025 | 1-12053991 / Western | Artificial Intelligence (AI) and Data Science: 60; Artificial Intelligence and Machine Learning: 120 | [EoA, page 1](https://www.djsce.ac.in/docs/Mandatory/EOA%20Report%202025-26.PDF), [publisher identity](https://www.djsce.ac.in/) |
| Annasaheb Dange College of Engineering and Technology, Ashta | 2025–26 / 10 April 2025 | 1-4318091 / Western | Aeronautical Engineering: 60; Artificial Intelligence (AI) and Data Science: 60 | [EoA, page 1](https://www.adcet.ac.in/files/approvals/aicte/25-EOA_Report_2025-26.pdf), [publisher identity](https://www.adcet.ac.in/) |

Only two selected undergraduate Engineering and Technology courses per profile are represented. These are not complete course inventories. The 2025–26 intake column was checked separately from the adjacent 2024–25 column; equal values do not imply approval for another year. No 2026–27 profile is manufactured. Historical letter conditions are not converted to present-day noncompliance.

Implementation inventory: `packages/reference/institutions.ts`, exposed through authenticated read-only `GET /api/reference/institutions` and the Public references workspace. Every meaningful fact retains its own source URL, publisher, document date, academic year, PDF location, retrieval date, extraction method, SHA-256 and review status. The small collection is validated on load. Searching by permanent ID and filtering historical year do not touch operational records.

Review status is **TEAM_HUMAN_REVIEW_PENDING**. Agent-assisted local extraction and rendered-page comparison are not represented as team human sign-off. Local PyMuPDF and page renders were used; no paid OCR or LLM endpoint was used. Private analysis copies remain ignored; no complete publisher PDF or source page image is distributed in the repository.

| Retrieved source | SHA-256 of privately analysed bytes |
|---|---|
| Vidyalankar EoA | `6789ff31a4bc0ce211af01539cc1f4934f4fbc5d3c0d32068dc593eb72ea7422` |
| DJSCE EoA | `dea4da911d07b504e29ff6643ed6d7ce5497aa2da835ff369415857c801dc717` |
| ADCET EoA | `bd1c6ad89ad76797242512ac9e3c6601a22d3a1ed4b6a6e901952275eec65a7a` |

A checksum shows byte identity, not authenticity or reuse permission. No whole-PDF redistribution licence was established. The inspected ADCET homepage explicitly reserves rights; no affirmative reuse grant was found in the inspected Vidyalankar disclosure/DJSCE home content. The product links to publishers and keeps only a small non-personal fact inventory. Institutional printer accounts, signatures, faculty names, phone numbers and personal contacts are not extracted. No blanket bulk-directory scraping or reuse permission is claimed.

The supplied [SNPIT approval archive](https://www.snpitrc.ac.in/AICTE_Approval.aspx) and its indexed 2025–26 PDF were investigated, but direct retrieval returned HTTP 403. Indexed text was not promoted into a verified fourth profile. A later human review should recheck publisher access, corrections, current applicability and reuse terms.

The [primary APH](https://www.aicte.gov.in/sites/default/files/APH%20Final.pdf) was accessible in this review; its title identifies 2024–25 through 2026–27. This does not validate Anumitra's DEMO windows, appointments, eligibility or quorum, and no new statutory numerical policy was encoded. No authorized workflow API contract, permitted live endpoint or government credentials were supplied or tested. The local fictional simulator remains separate.
