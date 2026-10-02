// Primary sources cited by articles. Each was read in full on the accessed date.

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessed: string;
}

export const sources = {
  masterCircular2024: {
    id: "masterCircular2024",
    title: "Master Circular on Health Insurance Business (IRDAI/HLT/CIR/PRO/84/5/2024), 29 May 2024",
    publisher: "Insurance Regulatory and Development Authority of India",
    url: "https://irdai.gov.in/document-detail?documentId=4942918",
    accessed: "2026-10-02",
  },
  proportionateDeduction2020: {
    id: "proportionateDeduction2020",
    title:
      "Modified Guidelines on Product filing in Health Insurance Business: Norms on Proportionate Deductions (IRDAI/HLT/REG/CIR/151/06/2020), 11 June 2020",
    publisher: "Insurance Regulatory and Development Authority of India",
    url: "https://irdai.gov.in/documents/37343/365525/Modified+Guidelines+on+Product+filing+in+Health+Insurance+Business-Norms+on.pdf/7b50effc-e553-f0a6-389d-3ca90ab11af5?version=1.0&t=1631531502137&download=true",
    accessed: "2026-10-02",
  },
  masterCircular2024Annexures: {
    id: "masterCircular2024Annexures",
    title: "Annexures to the Master Circular on Health Insurance Business, 29 May 2024 (Annexure-6: circulars superseded)",
    publisher: "Insurance Regulatory and Development Authority of India",
    url: "https://irdai.gov.in/document-detail?documentId=4942918",
    accessed: "2026-10-02",
  },
  dpdpAct2023: {
    id: "dpdpAct2023",
    title: "The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)",
    publisher: "Ministry of Electronics and Information Technology, Government of India",
    url: "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf",
    accessed: "2026-10-02",
  },
  iibPortal: {
    id: "iibPortal",
    title: "Insurance Information Bureau of India",
    publisher: "Insurance Information Bureau of India",
    url: "https://iib.gov.in/",
    accessed: "2026-10-02",
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof sources;
