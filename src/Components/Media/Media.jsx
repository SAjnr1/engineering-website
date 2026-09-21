import React from 'react'
import Navbar from '../Navbar/Navbar'
import './Media.css'
import Footer from '../Footer/footer'
import PublicMedia from '../PublicUser/PublicMedia'

const Media = () => {
  return (
    <>
    <Navbar/>
    <div className='media'>
      <PublicMedia/>

    <Footer/>
    </div>
    
    </>
  )
}

export default Media