import { authLayoutConfig } from '@config/auth'
import { LoginForm } from '@features/auth/components/login-form'
import { AuthSplitLayout } from '@shared/components/auth/auth-split-layout'

export default function LoginPage() {
  return (
    <AuthSplitLayout
      imageSrc={authLayoutConfig.imageSrc}
      imageAlt={authLayoutConfig.imageAlt}
      imageSide={authLayoutConfig.imageSide}
      brand={
        <span className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--ant-color-text)]">
          <span className="grid size-8 place-items-center rounded-xl bg-violet-600 text-sm font-bold text-white">
            R
          </span>
          <span>RS Admin</span>
        </span>
      }
      caption={
        <div className="max-w-sm">
          <p className="text-xl font-semibold">my-resume 后台管理</p>
          <p className="mt-2 text-sm text-white/80">
            简历编辑、AI 工作台、RAG 管理与发布，一站式后台。
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthSplitLayout>
  )
}
