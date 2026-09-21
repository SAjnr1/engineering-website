import React from 'react'
import Navbar from '../Navbar/Navbar'
import './Student.css'
import Footer from '../Footer/footer'
import YearGroups from '../PublicUser/PublicYearGroups'

const Student = () => {
  return (
    <>
    <Navbar/>
    <div className='student'>
      <YearGroups/>

    <Footer/>
    </div>
    </>
  )
}

export default Student
