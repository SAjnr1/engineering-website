import React, { useEffect, useRef } from 'react'
import './Homepage.css'
import ThreeScene from '../../ThreeScene/ThreeScene3'
import { Cog, GraduationCap, Clapperboard, CalendarDaysIcon } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import { Link } from 'react-router-dom';
import Footer from '../Footer/footer';
import Hero from '../../assets/engineering-logo.png'
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

const Homepage = () => {
  const engineeringRef = useRef(null);
  const unitRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(engineeringRef.current, {
      duration: 4,
      scrambleText: {
        text: "Engineering",
        chars: "QWERTYUIOPLKJHGFDSAZXCVBNM",
        revealDelay: 0,
        speed: 0.4,
      },
    }).to(unitRef.current, {
      duration: 2,
      scrambleText: {
        text: "Unit",
        chars: "QWERTYUIOPLKJHGFDSAZXCVBNM",
        revealDelay: 0.3,
        speed: 0.4,
      },
    }, "-=0.6"); // start slightly before the first one finishes

    return () => tl.kill();
  }, []);

  return (
    <>
   <Navbar/>
    <div className="homepage">
      <div className="engineering">
        <div className="model">
          <ThreeScene/>
        </div>
        <div className="hero">
          <img src={Hero} alt='' className='img'/>
        </div>
        <div className="engineering-profile">
          <div className="unit-name">
          <h2 className="unit" ref={engineeringRef}></h2><h2 ref={unitRef}></h2>
          </div>
          <div className="unit-quote">
            <p>Welcome to the official website of the PRESEC-Legon Engineering Unit.
              Here you'll find information about our classes, students,projects and everything that makes our engineering journey special.
            </p>
          </div>
        </div>
      </div>
      <div className="menu-cards">
        <Link to='/student' end className='student-link'>
        <ul className="card">
          <GraduationCap className='home-icon' strokeWidth={2}/>
          <span>Students</span>
        </ul>
        </Link>

        <Link to='/project' className='project-link'>
        <ul className="card"> 
          <Cog className='home-icon' strokeWidth={2}/>
          <span>Projects</span>  
        </ul>
        </Link>

        <Link to='/events' className='media-link'>
        <ul className="card">
          <CalendarDaysIcon className='home-icon' strokeWidth={2}/>
          <span>Events</span>
        </ul>
        </Link>

        <Link to='/media' className="media-link">
        <ul className="card">
          <Clapperboard className='home-icon' strokeWidth={2}/>
          <span>Media</span>
        </ul>
        </Link>

      </div>
      <Footer/>
    </div>

    </>
  )
}

export default Homepage