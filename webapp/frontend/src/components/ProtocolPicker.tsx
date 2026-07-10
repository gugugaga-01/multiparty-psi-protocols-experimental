import { Select } from 'animal-island-ui'
import type { ReactNode } from 'react'
import { useProtocolSelection } from '../ProtocolSelectionContext'
import type { ProtocolCategoryId, ProtocolId } from '../protocolCatalog'
import { useI18n } from '../i18n'

export function ProtocolPicker({
  disabled = false,
  categoryClassName = 'field compact',
  protocolClassName = 'field grow',
  hint,
}: {
  disabled?: boolean
  categoryClassName?: string
  protocolClassName?: string
  hint?: ReactNode
}) {
  const { t } = useI18n()
  const {
    category,
    protocol,
    categories,
    protocols,
    missingProtocols,
    locked,
    setCategory,
    setProtocol,
  } = useProtocolSelection()
  const unavailable = disabled || locked || !category || !protocol

  return (
    <>
      <label className={`${categoryClassName} protocol-category-field`}>
        <span>{t('protocol.category')}</span>
        <Select
          options={categories.map((item) => ({ key: item.id, label: t(item.labelKey) }))}
          value={category?.id ?? ''}
          onChange={(value) => setCategory(value as ProtocolCategoryId)}
          disabled={unavailable}
        />
      </label>
      <label className={`${protocolClassName} protocol-option-field`}>
        <span>{t('protocol.selector')}</span>
        <Select
          options={protocols.map((item) => ({ key: item.id, label: item.name }))}
          value={protocol?.id ?? ''}
          onChange={(value) => setProtocol(value as ProtocolId)}
          disabled={unavailable}
        />
        {!protocol && <small>{t('protocol.noneAvailable')}</small>}
        {hint}
        {missingProtocols.length > 0 && (
          <small>{t('protocol.notBuilt', { list: missingProtocols.map((item) => item.name).join(', ') })}</small>
        )}
      </label>
    </>
  )
}
