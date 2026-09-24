import React, { useEffect, useState } from 'react'
import './Navbar.css'
{/*import { Link } from 'react-scroll';*/}
import { Link, NavLink } from 'react-router-dom';
import { Home, Cog, GraduationCap, Clapperboard,  CalendarDaysIcon, Presentation, UserGroup } from 'lucide-react';


const Navbar = () => {

   const [sticky, setSticky] = useState(false);

   useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
   }, []); 

  return (
    <>
      {/* Top nav: full links on desktop, just logo on mobile (bottom bar handles nav there) */}
      <nav className={`container ${sticky ? 'dark-nav' : ''}`}>
     
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
       <li>
          <NavLink to='/admin/teachers' className='student-link'>
            <UserGroup strokeWidth={2} />
            <span>Teachers</span>
          </NavLink>
        </li> 
        <li>
          <NavLink to='/admin/project' className='project-link'>
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
          <NavLink to='/admin/events' className='about-link'>
            <CalendarDaysIcon strokeWidth={2} />
            <span>Events</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/admin/media' className='media-link'>
            <Clapperboard strokeWidth={2} />
            <span>Media</span>
          </NavLink>
        </li>
      </ul>
    </>
  )
}

export default Navbar
