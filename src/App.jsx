import React from 'react'
import Homepage from './Components/Homepage/Homepage'
import { Routes, Route } from 'react-router-dom'
import Student from './Components/Students/Student'
import Project from './Components/Project/Project'
import Media from './Components/Media/Media'


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/student" element={<Student />} />
      <Route path="/project" element={<Project />} />
      <Route path="/media" element={<Media />} />
    </Routes>
  )
}

export default App