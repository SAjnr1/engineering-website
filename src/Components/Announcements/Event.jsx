import React from 'react'
import './Event.css'
import Navbar from '../Navbar/Navbar'
import Announcement from '../PublicUser/PublicAnnouncements'
import Footer from '../Footer/footer'


const Event = () => {
  return (
    <div className='events'>
        <Navbar/>
        <Announcement/>
        <Footer/>
      
    </div>
  )
}

export default Event
