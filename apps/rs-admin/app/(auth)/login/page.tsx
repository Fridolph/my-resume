import { LoginForm } from '@features/auth/components/login-form'

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--ant-color-bg-layout)] p-4">
      <LoginForm />
    </div>
  )
}
