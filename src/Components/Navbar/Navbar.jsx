import React, { useEffect, useState } from 'react'
import './Navbar.css'
{/*import { Link } from 'react-scroll';*/}
import { Link, NavLink } from 'react-router-dom';
import { Home, Cog, GraduationCap, Clapperboard, Info } from 'lucide-react';


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
          <li><NavLink to='/' end className='home-link'>Home</NavLink></li>
          <li><NavLink to='/student' className='student-link'>Student</NavLink></li>
          <li><NavLink to='/project' className='project-link'>Projects</NavLink></li>
          <li><NavLink to='/about' className='about-link'>About Us</NavLink></li>
          <li><NavLink to='/media' className='media-link'>Media</NavLink></li>
        </ul>
      </nav>

      {/* Bottom tab bar: only rendered visually on mobile via CSS media query */}
      <ul className='bottom-nav'>
        <li>
          <NavLink to='/' end className='home-link'>
            <Home strokeWidth={2} />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/student' className='student-link'>
            <GraduationCap strokeWidth={2} />
            <span>Student</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/project' className='project-link'>
            <Cog strokeWidth={2} />
            <span>Project</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/about' className='about-link'>
            <Info strokeWidth={2} />
            <span>About</span>
          </NavLink>
        </li>
        <li>
          <NavLink to='/media' className='media-link'>
            <Clapperboard strokeWidth={2} />
            <span>Media</span>
          </NavLink>
        </li>
      </ul>
    </>
  )
}

export default Navbar
