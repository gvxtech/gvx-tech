export type PageId = 'home' | 'services' | 'solutions' | 'projects' | 'about' | 'contact';

export const NAV_PAGES: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];
