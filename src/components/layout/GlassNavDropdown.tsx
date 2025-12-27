import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Navbar,
  Collapse,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const resourcesMenuItems = [
  { title: 'How to Use', path: '/blog/how-to-use-otagon-guide' },
  { title: 'Gaming Guides', path: '/blog' },
  { title: 'FAQ', path: '/about#faq' },
  { title: 'About Us', path: '/about' },
  { title: 'Contact', path: '/contact' },
];

function ResourcesMenu({ onNavItemClick }: { onNavItemClick?: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    if (path.includes('#')) {
      const [route, hash] = path.split('#');
      navigate(route || '/');
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {element.scrollIntoView({ behavior: 'smooth' });}
      }, 100);
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    onNavItemClick?.();
  };

  return (
    <React.Fragment>
      <Menu
        open={isMenuOpen}
        handler={setIsMenuOpen}
        placement="bottom"
        allowHover={true}
      >
        <MenuHandler>
          {/* @ts-expect-error Material Tailwind React 18 compatibility */}
          <Typography as="div" variant="small" className="font-medium">
            {/* @ts-expect-error Material Tailwind React 18 compatibility */}
            <ListItem
              className="flex items-center gap-2 py-2 pr-4 font-medium text-white hover:font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] transition-all"
              selected={isMenuOpen || isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((cur) => !cur)}
            >
              Resources
              <ChevronDownIcon
                strokeWidth={2.5}
                className={`hidden h-3 w-3 transition-transform lg:block ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
              <ChevronDownIcon
                strokeWidth={2.5}
                className={`block h-3 w-3 transition-transform lg:hidden ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </ListItem>
          </Typography>
        </MenuHandler>
        {/* @ts-expect-error Material Tailwind React 18 compatibility */}
        <MenuList className="hidden rounded-xl lg:block bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 py-4">
          {resourcesMenuItems.map(({ title, path }) => (
            // @ts-expect-error Material Tailwind React 18 compatibility
            <MenuItem
              key={path}
              onClick={() => handleNavigation(path)}
              className="text-white text-left hover:font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] py-3 transition-all focus:outline-none focus:bg-transparent active:bg-transparent"
            >
              {title}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      <div className="block lg:hidden">
        <Collapse open={isMobileMenuOpen}>
          {resourcesMenuItems.map(({ title, path }) => (
            // @ts-expect-error Material Tailwind React 18 compatibility
            <MenuItem
              key={path}
              onClick={() => handleNavigation(path)}
              className="text-white text-left hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F]"
            >
              {title}
            </MenuItem>
          ))}
        </Collapse>
      </div>
    </React.Fragment>
  );
}

function NavList({ isPricingVisible = false, isHowItWorksVisible = false, onNavItemClick }: { isPricingVisible?: boolean; isHowItWorksVisible?: boolean; onNavItemClick?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleNavClick = (callback: () => void) => {
    callback();
    onNavItemClick?.();
  };

  return (
    // @ts-expect-error Material Tailwind React 18 compatibility
    <List className="mb-6 mt-4 p-0 lg:mb-0 lg:mt-0 lg:flex-row lg:p-1">
      {!isHome && (
        // @ts-expect-error Material Tailwind React 18 compatibility
        <Typography
          as="div"
          variant="small"
          className="font-medium"
        >
          {/* @ts-expect-error Material Tailwind React 18 compatibility */}
          <ListItem
            onClick={() => handleNavClick(() => navigate('/'))}
            className={`flex items-center gap-2 py-2 pr-4 cursor-pointer transition-all ${
              isHome
                ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]'
                : 'text-white hover:font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F]'
            }`}
          >
            Home
          </ListItem>
        </Typography>
      )}
      {/* @ts-expect-error Material Tailwind React 18 compatibility */}
      <Typography
        as="div"
        variant="small"
        className="font-medium"
      >
        {/* @ts-expect-error Material Tailwind React 18 compatibility */}
        <ListItem
          onClick={() => handleNavClick(() => {
            navigate('/');
            setTimeout(() => {
              const element = document.getElementById('how-it-works');
              if (element) {element.scrollIntoView({ behavior: 'smooth', block: 'center' });}
            }, 100);
          })}
          className={`flex items-center gap-2 py-2 pr-4 cursor-pointer transition-all ${
            isHome && isHowItWorksVisible
              ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]'
              : 'text-white hover:font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F]'
          }`}
        >
          How to Use
        </ListItem>
      </Typography>
      {/* @ts-expect-error Material Tailwind React 18 compatibility */}
      <Typography
        as="div"
        variant="small"
        className="font-medium"
      >
        {/* @ts-expect-error Material Tailwind React 18 compatibility */}
        <ListItem
          onClick={() => handleNavClick(() => {
            navigate('/');
            setTimeout(() => {
              const element = document.getElementById('pricing');
              if (element) {element.scrollIntoView({ behavior: 'smooth', block: 'center' });}
            }, 100);
          })}
          className={`flex items-center gap-2 py-2 pr-4 cursor-pointer transition-all ${
            isHome && isPricingVisible
              ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E53A3A] to-[#D98C1F]'
              : 'text-white hover:font-bold hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F]'
          }`}
        >
          Pricing
        </ListItem>
      </Typography>
      <ResourcesMenu onNavItemClick={onNavItemClick} />
    </List>
  );
}

export const GlassNavDropdown = () => {
  const [openNav, setOpenNav] = useState(false);
  const [isPricingVisible, setIsPricingVisible] = useState(false);
  const [isHowItWorksVisible, setIsHowItWorksVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 960) {setOpenNav(false);}
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    const pricingElement = document.getElementById('pricing');
    if (!pricingElement) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPricingVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(pricingElement);
    return () => observer.unobserve(pricingElement);
  }, []);

  React.useEffect(() => {
    const howItWorksElement = document.getElementById('how-it-works');
    if (!howItWorksElement) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHowItWorksVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(howItWorksElement);
    return () => observer.unobserve(howItWorksElement);
  }, []);

  const handleEarlyAccessClick = () => {
    const isOnLandingPage = window.location.pathname === '/';
    
    if (isOnLandingPage) {
      // Already on landing page, just scroll to waitlist form
      const waitlistForm = document.getElementById('waitlist-form');
      if (waitlistForm) {
        waitlistForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Navigate to landing page, then scroll to waitlist
      navigate('/');
      setTimeout(() => {
        const waitlistForm = document.getElementById('waitlist-form');
        if (waitlistForm) {
          waitlistForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  return (
    // @ts-expect-error Material Tailwind React 18 compatibility
    <Navbar className="mx-auto max-w-screen-xl px-4 py-2 bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-lg">
      <div className="flex items-center justify-between text-white">
        <div
          className="mr-4 cursor-pointer py-1.5 lg:ml-2 flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOnLandingPage = location.pathname === '/';
            if (isOnLandingPage) {
              // Already on landing page, find the scroll container and scroll to top
              const scrollContainer = document.querySelector('.custom-scrollbar');
              if (scrollContainer) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                // Fallback to window scroll
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            } else {
              // Navigate to landing page first, then scroll to top
              navigate('/');
              setTimeout(() => {
                const scrollContainer = document.querySelector('.custom-scrollbar');
                if (scrollContainer) {
                  scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }, 100);
            }
          }}
        >
          <img 
            src="/images/otagon-logo.png" 
            alt="Otagon Logo" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
            Otagon
          </span>
        </div>
        <div className="hidden lg:block">
          <NavList isPricingVisible={isPricingVisible} isHowItWorksVisible={isHowItWorksVisible} />
        </div>
        <div className="hidden gap-2 lg:flex">
          {/* @ts-expect-error Material Tailwind React 18 compatibility */}
          <Button
            size="sm"
            onClick={handleEarlyAccessClick}
            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] normal-case"
          >
            Early Access
          </Button>
        </div>
        {/* @ts-expect-error Material Tailwind React 18 compatibility */}
        <IconButton
          variant="text"
          className="lg:hidden text-white/25 hover:bg-white/10"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <XMarkIcon className="h-6 w-6 opacity-100" strokeWidth={2} />
          ) : (
            <Bars3Icon className="h-6 w-6" strokeWidth={2} />
          )}
        </IconButton>
      </div>
      <Collapse open={openNav}>
        <NavList isPricingVisible={isPricingVisible} isHowItWorksVisible={isHowItWorksVisible} onNavItemClick={() => setOpenNav(false)} />
        <div className="flex w-full flex-nowrap items-center gap-2 lg:hidden">
          {/* @ts-expect-error Material Tailwind React 18 compatibility */}
          <Button
            size="sm"
            fullWidth
            onClick={() => {
              handleEarlyAccessClick();
              setOpenNav(false);
            }}
            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] normal-case"
          >
            Early Access
          </Button>
        </div>
      </Collapse>
    </Navbar>
  );
};
