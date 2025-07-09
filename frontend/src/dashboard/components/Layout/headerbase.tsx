import type { ReactNode } from 'react';

interface HeaderBaseProps {
  children: ReactNode;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
}

/**
 * HeaderBase Component
 *
 * A foundational component that provides common styling and responsive behavior
 * for application headers (both mobile and desktop). It handles fixed positioning,
 * background, borders, height, padding, and adjusts its left position based on
 * the sidebar's collapsed state. It also manages its visibility based on screen size.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the header. This is typically
 * the specific header content (e.g., logo, navigation buttons, user info).
 * @param {boolean} [props.isSidebarCollapsed=false] - A boolean indicating whether the desktop sidebar
 * is currently collapsed. This prop is primarily used when `isMobile` is false (for desktop headers)
 * to determine the appropriate left offset for the header.
 * @param {boolean} [props.isMobile=false] - A boolean flag to designate if this instance of HeaderBase
 * is for a mobile header. If true, it will be visible on small screens and hidden on medium and larger screens.
 * If false, it will be hidden on small screens and visible on medium and larger screens.
 * @returns {JSX.Element} The rendered HeaderBase component.
 */
const HeaderBase: React.FC<HeaderBaseProps> = ({ children, isSidebarCollapsed = false, isMobile = false }) => {
  const leftSpacing = isMobile ? 'left-0' : isSidebarCollapsed ? 'left-20' : 'left-64';

  return (
    <div
      className={`fixed top-0 ${leftSpacing} right-0 z-50 h-16 px-4 flex items-center bg-white border-b border-gray-200 transition-all duration-300 ${isMobile ? 'md:hidden' : 'hidden md:flex'}`}
      role="banner"
    >
      {children}
    </div>
  );
};

export default HeaderBase;
