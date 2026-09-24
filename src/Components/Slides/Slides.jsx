import React from 'react'
import Navbar from '../Navbar/Navbar'
import PublicPresentations from '../PublicUser/PublicPresentations'
import Footer from '../Footer/footer'
import './Slides.css'

const Slides = () => {
  return (
    <>
    <Navbar/>
    <div className='slides'>
      
      <PublicPresentations/>
      <Footer/>
    </div>
    </>
  )
}

export default Slides
