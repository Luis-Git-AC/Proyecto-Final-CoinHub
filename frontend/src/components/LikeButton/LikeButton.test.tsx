import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthContext, type AuthContextValue } from '../../context/AuthContext'
import type { User } from '../../types/user'
import type { Post } from '../../types/post'
import LikeButton from './LikeButton'

vi.mock('../../services/posts', () => ({
  toggleLike: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../Toasts/useToast', () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}))

vi.mock('./LikeButton.module.css', () => ({
  default: { button: 'button', pill: 'pill', icon: 'icon', count: 'count' },
}))

vi.mock('../Button/BaseButton.module.css', () => ({
  default: { button: 'button' },
}))

const mockUser: User = {
  _id: 'user-1',
  username: 'tester',
  email: 'test@test.com',
  role: 'user',
  avatar: null,
  wallet_address: '',
  createdAt: '',
  updatedAt: '',
}

const mockPost: Post = {
  _id: 'post-1',
  userId: { _id: 'other-user', username: 'autor', avatar: null, role: 'user' },
  title: 'Test post',
  content: 'Content',
  category: 'análisis',
  image: null,
  likes: [],
  createdAt: '',
  updatedAt: '',
}

function renderLikeButton(authOverride: Partial<AuthContextValue> = {}, postOverride: Partial<Post> = {}) {
  const authValue: AuthContextValue = {
    user: mockUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    clearError: () => {},
    loginUser: async () => mockUser,
    registerUser: async () => mockUser,
    logoutUser: () => {},
    loadCurrentUser: async () => {},
    ...authOverride,
  }

  return render(
    <AuthContext.Provider value={authValue}>
      <LikeButton post={{ ...mockPost, ...postOverride }} interactive showCount />
    </AuthContext.Provider>
  )
}

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el contador de likes', () => {
    renderLikeButton({}, { likes: ['a', 'b', 'c'] })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('incrementa el contador al hacer click (usuario autenticado)', async () => {
    const { toggleLike } = await import('../../services/posts')
    renderLikeButton({}, { likes: [] })

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toggleLike).toHaveBeenCalledWith('post-1')
    })
  })

  it('no renderiza nada cuando interactive es false', () => {
    const { container } = render(
      <AuthContext.Provider value={{
        user: mockUser, loading: false, error: null,
        isAuthenticated: true, clearError: () => {},
        loginUser: async () => mockUser, registerUser: async () => mockUser,
        logoutUser: () => {}, loadCurrentUser: async () => {},
      }}>
        <LikeButton post={mockPost} interactive={false} />
      </AuthContext.Provider>
    )
    expect(container).toBeEmptyDOMElement()
  })
})
