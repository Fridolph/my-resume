interface ReadOnlyNotice {
  title: string
  description: string
}

interface OperationRestriction {
  disabled: boolean
  reason: string
}

interface OperationConfirmOptions {
  title: string
  description: string
}

export function useOperationGuidance() {
  function createReadOnlyNotice(moduleLabel: string): ReadOnlyNotice {
    return {
      title: `当前账号在${moduleLabel}中为只读模式`,
      description: `你可以查看当前${moduleLabel}的内容、状态和版本信息，但不能执行保存、恢复、发布、删除或切换操作。若需要继续修改，请切换到具备写权限的账号。`
    }
  }

  async function confirmOperation(options: OperationConfirmOptions) {
    if (import.meta.server) {
      return true
    }

    return window.confirm(`${options.title}\n\n${options.description}`)
  }

  function getRestoreRestriction(changed: boolean, moduleLabel: string): OperationRestriction {
    if (!changed) {
      return {
        disabled: true,
        reason: `该历史版本与当前${moduleLabel}一致，无需重复恢复。`
      }
    }

    return {
      disabled: false,
      reason: `恢复后会覆盖当前${moduleLabel}，并生成新的恢复版本记录。`
    }
  }

  function getMoveRestriction(isEdgeItem: boolean, direction: 'up' | 'down'): OperationRestriction {
    if (isEdgeItem) {
      return {
        disabled: true,
        reason: direction === 'up'
          ? '当前已经是第一项，不能继续上移。'
          : '当前已经是最后一项，不能继续下移。'
      }
    }

    return {
      disabled: false,
      reason: direction === 'up'
        ? '上移后会与前一个项目交换排序值。'
        : '下移后会与后一个项目交换排序值。'
    }
  }

  return {
    createReadOnlyNotice,
    confirmOperation,
    getRestoreRestriction,
    getMoveRestriction
  }
}
