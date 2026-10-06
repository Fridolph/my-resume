import {
  CloudUploadOutlined,
  DashboardOutlined,
  HistoryOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

/**
 * 导航图标映射：config 中的 icon 字符串 → antd 图标组件。
 * 保持 config 为纯数据（不含 JSX），图标实现集中在此。
 */
export const navigationIconMap: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  resume: <ProfileOutlined />,
  ai: <RobotOutlined />,
  publish: <CloudUploadOutlined />,
  settings: <SettingOutlined />,
  help: <QuestionCircleOutlined />,
  changelog: <HistoryOutlined />,
}
