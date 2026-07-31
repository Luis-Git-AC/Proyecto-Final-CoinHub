import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from '../routes/AuthGuard'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'
import type { User } from '../types/user'

function renderWithAuth(authValue: Partial<AuthContextValue>, initialPath = '/protected') {
  const defaultValue: AuthContextValue = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    clearError: () => {},
    loginUser: async () => ({} as User),
    registerUser: async () => ({} as User),
    logoutUser: () => {},
    loadCurrentUser: async () => {},
    ...authValue,
  }

  return render(
    <AuthContext.Provider value={defaultValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route element={<AuthGuard />}>
            <Route path="/protected" element={<div>Contenido protegido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('AuthGuard', () => {
  it('redirige a /login si el usuario no está autenticado', () => {
    renderWithAuth({ isAuthenticated: false, loading: false })
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renderiza el contenido protegido si el usuario está autenticado', () => {
    renderWithAuth({ isAuthenticated: true, loading: false })
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument()
  })

  it('no renderiza nada mientras loading es true', () => {
    const { container } = renderWithAuth({ isAuthenticated: false, loading: true })
    expect(container).toBeEmptyDOMElement()
  })
})
