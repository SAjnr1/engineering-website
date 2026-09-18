import React from 'react'
import './Homepage.css'
import ThreeScene from '../../ThreeScene/ThreeScene3'
import { Cog, GraduationCap, Clapperboard, Info } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import { Link } from 'react-router-dom';
import Footer from '../Footer/footer';
import Hero from '../../assets/engineering-logo.png'


const Homepage = () => {
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
          <h2 className="unit">Engineering</h2><h2>Unit</h2>
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

        <ul className="card">
          <Info className='home-icon' strokeWidth={2}/>
          <span>About</span>
        </ul>

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