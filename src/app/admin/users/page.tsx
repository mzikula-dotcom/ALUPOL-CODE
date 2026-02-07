'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserData {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'DEALER'
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<UserData & { password?: string }> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingUser({
      email: '',
      name: '',
      role: 'DEALER',
      password: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(user: UserData) {
    setEditingUser({ ...user, password: '' })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!editingUser) return

    setSaving(true)
    try {
      const method = editingUser.id ? 'PUT' : 'POST'
      const body = { ...editingUser }

      // Don't send empty password on update
      if (editingUser.id && !editingUser.password) {
        delete body.password
      }

      const res = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setDialogOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(`Chyba: ${error.error || JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Nepodařilo se uložit')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchUsers()
      } else {
        alert('Nepodařilo se smazat')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uživatelé</h1>
          <p className="text-gray-500">Správa uživatelských účtů</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nový uživatel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seznam uživatelů</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jméno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Vytvořen</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {user.role === 'ADMIN' ? (
                            <Shield className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        {user.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' ? 'Administrátor' : 'Obchodník'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={users.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser?.id ? 'Upravit uživatele' : 'Nový uživatel'}
            </DialogTitle>
            <DialogDescription>
              {editingUser?.id
                ? 'Heslo vyplňte pouze pokud ho chcete změnit'
                : 'Vyplňte údaje nového uživatele'}
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jméno</Label>
                <Input
                  value={editingUser.name || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  placeholder="Jan Novák"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  placeholder="jan@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Heslo {editingUser.id && '(ponechte prázdné pro zachování)'}</Label>
                <Input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v) =>
                    setEditingUser({ ...editingUser, role: v as 'ADMIN' | 'DEALER' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEALER">Obchodník</SelectItem>
                    <SelectItem value="ADMIN">Administrátor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
