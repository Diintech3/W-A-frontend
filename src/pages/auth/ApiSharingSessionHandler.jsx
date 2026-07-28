import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import { Loader } from '../../components/ui/Loader'
import toast from 'react-hot-toast'

export default function ApiSharingSessionHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loadMe } = useAuthContext()

  useEffect(() => {
    const shareKey = searchParams.get('shareKey')
    const token = searchParams.get('token')
    const ref = searchParams.get('ref')

    if (shareKey && token && ref) {
      authApi.apiSharingLogin({
        apiSharingKey: shareKey,
        accessToken: token,
        referenceKey: ref,
      })
      .then((res) => {
        if (res.data?.success && res.data.data?.accessToken) {
          sessionStorage.setItem('accessToken', res.data.data.accessToken)
          sessionStorage.setItem('isApiSharingSession', 'true')
          toast.success('Connected to Whats AI via Magnifi AI!')
          loadMe().then((u) => {
            if (u?.role === 'client') {
              navigate('/', { replace: true })
            } else {
              navigate('/admin', { replace: true })
            }
          })
        } else {
          toast.error('API Sharing Verification Failed')
          navigate('/admin/login', { replace: true })
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Invalid or revoked API Sharing credentials')
        navigate('/admin/login', { replace: true })
      })
    } else {
      toast.error('Missing integration parameters')
      navigate('/admin/login', { replace: true })
    }
  }, [searchParams, navigate, loadMe])

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
      <Loader label="Verifying Magnifi AI API Sharing handshake..." />
    </div>
  )
}
