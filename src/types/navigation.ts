export type PageId = 'home'| 'about' | 'services' | 'solutions' | 'contact';

export const NAV_PAGES: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'solutions', label: 'Solutions' },
  // { id: 'projects', label: 'Projects' },
  
  { id: 'contact', label: 'Contact' },
];
