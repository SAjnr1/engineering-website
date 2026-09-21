import React from 'react'
import Navbar from '../Navbar/Navbar'
import './Project.css'
import Footer from '../Footer/footer'
import PublicProjects from '../PublicUser/PublicProjects'

const Project = () => {
  return (
    <>
    <Navbar/>
    <div className='project'>
      <PublicProjects/>
    
    <Footer/>
    </div>
    
    </>
  )
}

export default Project