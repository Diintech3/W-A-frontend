import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { Loader } from '../../components/ui/Loader'

export default function ImpersonateSessionHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loadMe } = useAuthContext()

  useEffect(() => {
    const token = searchParams.get('token')
    const role = searchParams.get('role') || 'client'
    if (token) {
      sessionStorage.setItem('accessToken', token)
      sessionStorage.setItem('isImpersonatedSession', 'true')
      loadMe().then(() => {
        if (role === 'admin') navigate('/admin', { replace: true })
        else navigate('/', { replace: true })
      })
    } else {
      navigate(role === 'admin' ? '/admin/login' : '/client/login', { replace: true })
    }
  }, [searchParams, navigate, loadMe])

  return <Loader label="Initializing isolated workspace session..." />
}
