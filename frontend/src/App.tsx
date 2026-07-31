import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/variables.css'
import './styles/globals.css'

import Home from './pages/Home/Home'
import Criptos from './pages/Criptos/Criptos'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import AuthGuard from './routes/AuthGuard'
import RootLayout from './components/Layout/RootLayout'

const Portfolio     = lazy(() => import('./pages/Portfolio/Portfolio'))
const Profile       = lazy(() => import('./pages/Profile/Profile'))
const PostsList     = lazy(() => import('./pages/Posts/PostsList'))
const PostDetail    = lazy(() => import('./pages/Posts/PostDetail'))
const PostForm      = lazy(() => import('./pages/Posts/PostForm'))
const ResourcesList = lazy(() => import('./pages/Resources/ResourcesList'))
const ResourceDetail = lazy(() => import('./pages/Resources/ResourceDetail'))
const ResourceForm  = lazy(() => import('./pages/Resources/ResourceForm'))
const AdminUsers    = lazy(() => import('./pages/Admin/AdminUsers'))
const NotFound      = lazy(() => import('./pages/NotFound/NotFound'))

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="page-loader">Cargando…</div>}>
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
