import { useEffect, useState, useCallback } from 'react'
import { listUsers, deleteUser, promoteUser, demoteUser } from '../../services/users'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import useConfirm from '../../components/Confirm/useConfirm'
import BaseButton from '../../components/Button/BaseButton'
import Pagination from '../../components/ui/Pagination/Pagination'
import Tooltip from '../../components/ui/Tooltip/Tooltip'
import styles from './AdminUsers.module.css'
import type { User } from '../../types/user'

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async (pageNumber = 1) => {
    if (!user) return
    setLoading(true)
    try {
      const res = await listUsers({ page: pageNumber, limit: 20 })
      const rolesOrder = ['owner', 'admin', 'user']
      const usersRaw: User[] = res.users || []

      usersRaw.sort((userA, userB) => {
        const roleIndexA = rolesOrder.indexOf(userA.role ?? 'user')
        const roleIndexB = rolesOrder.indexOf(userB.role ?? 'user')
        if (roleIndexA !== roleIndexB) return roleIndexA - roleIndexB
        return Date.parse(userB.createdAt) - Date.parse(userA.createdAt)
      })
      setUsers(usersRaw)
      setPage(res.pagination?.page ?? pageNumber)
      setPages(res.pagination?.pages ?? 1)
    } catch (err) {
      console.error(err)
      toast.error('Error cargando usuarios')
    } finally { setLoading(false) }
  }, [user, toast])

  useEffect(() => { load(1) }, [user, load])

  const handleDelete = async (id: string) => {
    if (!user) return toast.error('No autorizado')
    const confirmed = await confirm('Eliminar usuario y todo su contenido?')
    if (!confirmed) return
    try {
      await deleteUser(id)
      toast.success('Usuario eliminado')
      load(page)
    } catch (err) {
      console.error(err)
      toast.error('Error eliminando usuario')
    }
  }

  const handlePromote = async (id: string) => {
    if (!user) return toast.error('No autorizado')
    const confirmed = await confirm({ message: 'Promover a admin a este usuario?', requiredText: 'PROMOVER' })
    if (!confirmed) return
    try {
      await promoteUser(id, 'admin')
      toast.success('Usuario promovido a admin')
      load(page)
    } catch (err) {
      console.error(err)
      toast.error('Error promoviendo usuario')
    }
  }

  const handleDemote = async (id: string) => {
    if (!user) return toast.error('No autorizado')
    const confirmed = await confirm({ message: 'Despromocionar a usuario a este admin?', requiredText: 'DESPROMOCIONAR' })
    if (!confirmed) return
    try {
      await demoteUser(id)
      toast.success('Usuario despromocionado a user')
      load(page)
    } catch (err) {
      console.error(err)
      toast.error('Error despromocionando usuario')
    }
  }

  if (!user || !['admin', 'owner'].includes(user.role)) return <div style={{ maxWidth: 900, margin: '2rem auto' }}>No autorizado</div>

  return (
    <div className={styles.root} style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>Panel de administrador</h2>
      {loading && <div>Cargando...</div>}
      <div style={{ marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color-light)', padding: '.5rem' }}>Usuario</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color-light)', padding: '.5rem' }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color-light)', padding: '.5rem' }}>Rol</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color-light)', padding: '.5rem' }}>Creado</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color-light)', padding: '.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(['owner', 'admin', 'user'] as const).map(role => {
              const group = users.filter(userItem => (userItem.role ?? 'user') === role)
              if (!group.length) return null
              return (
                <>
                  <tr key={`header-${role}`}>
                    <td colSpan={5} className={styles.roleHeader}>{role.toUpperCase()}</td>
                  </tr>
                  {group.map(userItem => (
                    <tr key={userItem._id}>
                      <td style={{ padding: '.5rem', borderBottom: '1px solid var(--border-color-light)' }}>{userItem.username}</td>
                      <td style={{ padding: '.5rem', borderBottom: '1px solid var(--border-color-light)' }}>{userItem.email || '-'}</td>
                      <td style={{ padding: '.5rem', borderBottom: '1px solid var(--border-color-light)' }}>{userItem.role}</td>
                      <td style={{ padding: '.5rem', borderBottom: '1px solid var(--border-color-light)' }}>{new Date(userItem.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '.5rem', borderBottom: '1px solid var(--border-color-light)' }}>
                        {(() => {
                          const isSelf = userItem._id === user._id
                          const isOwnerRole = userItem.role === 'owner'
                          const isAdminRole = userItem.role === 'admin'
                          const requesterIsOwner = user.role === 'owner'
                          const canDelete = !isSelf && !isOwnerRole && !(isAdminRole && !requesterIsOwner)
                          let title = 'Eliminar usuario'
                          if (isSelf) title = 'No puedes eliminar tu propio usuario'
                          else if (isOwnerRole) title = 'No puedes eliminar a un owner'
                          else if (isAdminRole && !requesterIsOwner) title = 'Solo el owner puede eliminar a administradores'
                          return (
                            <BaseButton
                              onClick={() => handleDelete(userItem._id)}
                              variant="danger"
                              size="sm"
                              disabled={!canDelete}
                              title={title}
                              aria-label={title}
                              iconOnly
                            >
                              <span aria-hidden>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                              </span>
                            </BaseButton>
                          )
                        })()}
                        {userItem.role !== 'admin' && userItem.role !== 'owner' && (
                          <Tooltip content="Promover a admin" position="top">
                            <BaseButton
                              onClick={() => handlePromote(userItem._id)}
                              variant="primary"
                              size="sm"
                              style={{ marginLeft: '.5rem' }}
                              disabled={userItem._id === user._id}
                              title='Promocionar a admin'
                              aria-label="Promocionar a admin"
                              iconOnly
                            >
                              <span aria-hidden>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z" />
                              </svg>
                            </span>
                          </BaseButton>
                          </Tooltip>
                        )}
                        {user.role === 'owner' && userItem.role === 'admin' && (
                          <Tooltip content="Revocar admin" position="top">
                            <BaseButton
                              onClick={() => handleDemote(userItem._id)}
                              variant="ghost"
                              size="sm"
                              style={{ marginLeft: '.5rem' }}
                              title="Despromocionar a usuario"
                              aria-label="Despromocionar a usuario"
                              iconOnly
                            >
                              <span aria-hidden>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.59-5.58L4 12l8 8 8-8z" />
                                </svg>
                              </span>
                            </BaseButton>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <Pagination page={page} totalPages={pages} onPageChange={(p) => load(p)} />
      </div>
    </div>
  )
}
