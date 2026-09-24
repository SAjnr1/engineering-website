import React from 'react'
import Homepage from './Components/Homepage/Homepage'
import { Routes, Route, Navigate } from 'react-router-dom'
import Student from './Components/Students/Student'
import Project from './Components/Project/Project'
import Media from './Components/Media/Media'
import ProtectedRoute from './ProtectedRoute'
import AdminAnnouncement from './pages/Announcement/AdminAnnouncement'
import AdminMedia from './pages/Media/AdminMedia'
import AdminProject from './pages/Project/AdminProject'
import AdminStudent from './pages/Student/AdminStudent'
import AdminHome from './pages/Homepage/Homepage'
import AdminYearGroup from './pages/Year Group/YearGroupPage'
import Event from './Components/Announcements/Event'
import ProjectPage from './pages/ProjectPage/ProjectPage'
import AdminLogin from './pages/AdminLogin/AdminLogin'
import Slides from './Components/Slides/Slides'
import Teachers from './Components/Teachers/Teachers'
import AdminTeacher from './pages/Teachers/AdminTeacher'
import AdminPresentation from './pages/Slides/AdminPresentation'




const App = () => {
  return (
    
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/student" element={<Student />} />
      <Route path="/project" element={<Project />} />
      <Route path="/media" element={<Media />} />
      <Route path="/events" element={<Event/>}/>
      <Route path="/student/:year" element={<Student />} />
      <Route path="/project/:id" element={<Project />} />
      <Route path="/slides" element={<Slides />} />
      <Route path="/teachers" element={<Teachers />} />

       <Route path="/admin/login" element={<AdminLogin/>} />

      <Route element={<ProtectedRoute/>}>
        <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
        <Route path="/admin/home" element={<AdminHome/>}/>
        <Route path="/admin/events" element={<AdminAnnouncement/>}/>
        <Route path="/admin/media" element={<AdminMedia/>}/>
        <Route path="/admin/project" element={<AdminProject/>}/>
        <Route path="/admin/year_group" element={<AdminStudent/>}/>
        <Route path="/admin/year_group/:year" element={<AdminYearGroup/>}/>
        <Route path="/admin/project/:id" element={<ProjectPage/>}/>
        <Route path="/admin/teachers" element={<AdminTeacher/>}/>
        <Route path="/admin/slides" element={<AdminPresentation/>}/>
      </Route>  
      

    </Routes>
  )
}

export default App