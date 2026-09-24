import React from 'react'
import './Teachers.css'
import Navbar from '../Navbar/Navbar'
import PublicTeachers from '../PublicUser/PublicTeachers'
import Footer from '../Footer/footer'

const Teachers = () => {
  return (
    <>
    <Navbar/>
    <div className='teachers'>
      <PublicTeachers/>
      <Footer/>
    </div>
    </>
  )
}

export default Teachers
