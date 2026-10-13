export const site = {
  name: "Knowvia",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "rishavdewan10@gmail.com",
  description:
    "Knowvia reads every health policy in your family and shows what is covered, what is unclear, and what to do next.",
};
