import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/variables.css'
import './styles/globals.css'

import Home from './pages/Home/Home'
import Criptos from './pages/Criptos/Criptos'
import Portfolio from './pages/Portfolio/Portfolio'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import AuthGuard from './routes/AuthGuard'
import Profile from './pages/Profile/Profile'
import PostsList from './pages/Posts/PostsList'
import PostDetail from './pages/Posts/PostDetail'
import PostForm from './pages/Posts/PostForm'
import ResourcesList from './pages/Resources/ResourcesList'
import ResourceDetail from './pages/Resources/ResourceDetail'
import ResourceForm from './pages/Resources/ResourceForm'
import AdminUsers from './pages/Admin/AdminUsers'

import RootLayout from './components/Layout/RootLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="criptos" element={<Criptos />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route element={<AuthGuard />}>
            <Route path="perfil" element={<Profile />} />
          </Route>

          <Route path="posts">
            <Route index element={<PostsList />} />
            <Route path=":id" element={<PostDetail />} />
          </Route>

          <Route element={<AuthGuard />}>
            <Route path="posts/new" element={<PostForm />} />
            <Route path="posts/:id/edit" element={<PostForm />} />
          </Route>

          <Route path="resources">
            <Route index element={<ResourcesList />} />
            <Route path=":id" element={<ResourceDetail />} />
          </Route>

          <Route element={<AuthGuard />}>
            <Route path="resources/new" element={<ResourceForm />} />
            <Route path="resources/:id/edit" element={<ResourceForm />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App