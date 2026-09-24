import React, { useEffect, useState } from 'react'
import './Navbar.css'
{/*import { Link } from 'react-scroll';*/}
import { Link, NavLink } from 'react-router-dom';
import { Home, Cog, GraduationCap, Clapperboard,  CalendarDaysIcon, Presentation, Users, Menu, X } from 'lucide-react';


const Navbar = () => {

   const [sticky, setSticky] = useState(false);
   const [menuOpen, setMenuOpen] = useState(false);

   useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
   }, []); 

   // Prevent background scroll while the side menu is open
   useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
   }, [menuOpen]);

   const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Top nav: full links on desktop, just logo on mobile (bottom bar handles nav there) */}
      <nav className='dark-nav'> {/*{`container ${sticky ? 'dark-nav' : ''}`*/}
     
        <ul className='desktop-nav-links'>
          <li><NavLink to='/admin/home' end className='home-link'>Home</NavLink></li>
          <li><NavLink to='/admin/year_group' className='student-link'>Students</NavLink></li>
          <li><NavLink to='/admin/teachers' className='student-link'>Teachers</NavLink></li>
          <li><NavLink to='/admin/project' className='project-link'>Projects</NavLink></li>
          <li><NavLink to='/admin/slides' className='student-link'>Slides</NavLink></li> 
          <li><NavLink to='/admin/events' className='about-link'>Events</NavLink></li>
          <li><NavLink to='/admin/media' className='media-link'>Media</NavLink></li>
        </ul>
      </nav>

      {/* Bottom tab bar: only rendered visually on mobile via CSS media query */}
      <ul className='bottom-nav'>
        <li>
          <NavLink to='/admin/home' end className='home-link'>
            <Home strokeWidth={2} />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/admin/year_group' className='student-link'>
            <GraduationCap strokeWidth={2} />
            <span>Students</span>
          </NavLink>
        </li>
      {/* <li>
          <NavLink to='/admin/teachers' className='student-link'>
            <Users strokeWidth={2} />
            <span>Teachers</span>
          </NavLink>
        </li>  */}
        <li>
          <NavLink to='/admin/project' className='project-link'>
            <Cog strokeWidth={2} />
            <span>Projects</span>
          </NavLink>
        </li>
       {/* <li>
          <NavLink to='/admin/slides' className='student-link'>
            <Presentation strokeWidth={2} />
            <span>Slides</span>
          </NavLink>
        </li>  */}
        <li>
          <NavLink to='/admin/events' className='about-link'>
            <CalendarDaysIcon strokeWidth={2} />
            <span>Events</span>
          </NavLink>
        </li>
        <li>
          {/* Replaces the old Media tab: opens the full side drawer instead of navigating */}
          <button
            type="button"
            className={`more-tab ${menuOpen ? 'active' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'More'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu strokeWidth={2} />
            <span>More</span>
          </button>
        </li>
      </ul>

      {/* Backdrop behind the side menu, closes it on click */}
      <div
        className={`side-menu-overlay ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      {/* Side drawer menu, opened via the "More" tab — only rendered visually on mobile via CSS */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="side-menu-close"
          aria-label="Close menu"
          onClick={closeMenu}
        >
          <X strokeWidth={2} />
        </button>

        <ul>
          <li>
            <NavLink to='/admin/home' end className='home-link' onClick={closeMenu}>
              <Home strokeWidth={2} />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to='/admin/year_group' className='student-link' onClick={closeMenu}>
              <GraduationCap strokeWidth={2} />
              <span>Students</span>
            </NavLink>
          </li>
          <li>
          <NavLink to='/admin/teachers' className='student-link'>
            <Users strokeWidth={2} />
            <span>Teachers</span>
          </NavLink>
        </li>
          <li>
            <NavLink to='/admin/project' className='project-link' onClick={closeMenu}>
              <Cog strokeWidth={2} />
              <span>Projects</span>
            </NavLink>
          </li>
          <li>
          <NavLink to='/admin/slides' className='student-link'>
            <Presentation strokeWidth={2} />
            <span>Slides</span>
          </NavLink>
        </li>
 
          <li>
            <NavLink to='/admin/events' className='about-link' onClick={closeMenu}>
              <CalendarDaysIcon strokeWidth={2} />
              <span>Events</span>
            </NavLink>
          </li>
          <li>
            <NavLink to='/admin/media' className='media-link' onClick={closeMenu}>
              <Clapperboard strokeWidth={2} />
              <span>Media</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </>
  )
}

export default Navbar