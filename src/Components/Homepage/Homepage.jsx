import React from 'react'
import './Homepage.css'
import ThreeScene from '../../ThreeScene/ThreeScene3'
import { Cog, GraduationCap, Clapperboard, Info } from 'lucide-react';


const Homepage = () => {
  return (
    <div className="homepage">
      <div className="engineering">
        <div className="model">
          <ThreeScene/>
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
        <ul className="card">
          <GraduationCap className='home-icon' strokeWidth={2}/>
          <span>Students</span>
        </ul>
        <ul className="card">
          <Cog className='home-icon' strokeWidth={2}/>
          <span>Projects</span>
        </ul>
        <ul className="card">
          <Info className='home-icon' strokeWidth={2}/>
          <span>About</span>
        </ul>
        <ul className="card">
          <Clapperboard className='home-icon' strokeWidth={2}/>
          <span>Media</span>
        </ul>
      </div>
    </div>
  )
}

export default Homepage