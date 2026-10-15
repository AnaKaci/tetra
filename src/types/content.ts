export interface ContentImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  sourceUrl?: string;
}

export interface ContentSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
}

export interface Solution {
  id: string;
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: ContentSection[];
  image: ContentImage;
  heroImage?: ContentImage;
  icon: string;
  href: string;
  relatedPartnerIds: string[];
  relatedProjectIds: string[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  projectName: string;
  location?: string;
  installationYear?: string;
  parkingSpaces?: string;
  capacity?: { label: string; value: string };
  requirements: string[];
  solutionsProvided: string[];
  equipment: string[];
  image: ContentImage;
  href: string;
  relatedSolutionIds: string[];
}
