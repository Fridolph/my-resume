import { PublishedResumeShell } from '../modules/published-resume/shell'
import { DEFAULT_API_BASE_URL } from '../core/env'
import { fetchPublishedResume } from '../modules/published-resume/services/published-resume-api'

/**
 * 首页服务端入口先读取已发布简历，再交给客户端展示壳承接交互
 *
 * @returns 公开站首页节点
 */
export default async function WebHomePage() {
  // web 首页只读取 published snapshot，不参与草稿态编辑
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  })

  return (
    <PublishedResumeShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      enableClientSync
      publishedResume={publishedResume}
    />
  )
}
