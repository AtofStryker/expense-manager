import { FC } from 'react'

import { css, SerializedStyles } from '@emotion/react'
import { Typography } from '@mui/material'
import dynamic from 'next/dynamic'

import { useIsBigDevice } from '../shared/hooks'

type Variant = 'light' | 'dark'
type Size = 'small' | 'medium'

interface Props {
  variant?: Variant
  size?: Size
  hotkey: string
  ctrlKey?: boolean
}

const isMacOs = () => {
  if (typeof navigator === 'undefined') return false
  // eslint-disable-next-line deprecation/deprecation
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC')
}

const _ControlKeyLabel: FC = () => <>{isMacOs() ? '⌘' : 'ctrl'}</>
const ControlKeyLabel = dynamic(() => Promise.resolve(_ControlKeyLabel), {
  ssr: false,
})

const HotkeyLabel: FC<Props> = (props) => {
  const { size = 'medium', variant = 'light', hotkey, ctrlKey } = props
  const sizeStyle: { [key in Size]: SerializedStyles } = {
    small: css`
      padding: 1px 4px;
      font-size: 0.75rem;
    `,
    medium: css`
      padding: 2px 6px;
      font-size: 0.875rem;
    `,
  }
  const variantStyle: { [key in Variant]: SerializedStyles } = {
    light: css`
      border: 1px solid rgb(224, 227, 231);
      background-color: rgb(255, 255, 255);
    `,
    dark: css`
      border: 1px solid rgb(212, 217, 226);
      background-color: rgb(225, 230, 239);
    `,
  }
  const isBigDevice = useIsBigDevice()

  if (!isBigDevice) return null
  if (!ctrlKey) {
    return (
      <Typography
        variant="subtitle2"
        css={css`
          border-radius: 6px;
          text-transform: uppercase;
          display: inline;
          font-weight: 450;
          ${sizeStyle[size]}
          ${variantStyle[variant]}
        `}
      >
        {hotkey}
      </Typography>
    )
  }

  return (
    <div
      css={css`
        display: flex;
        & > * {
          margin-right: 8px;
        }
      `}
    >
      <Typography
        variant="subtitle2"
        css={css`
          border-radius: 6px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          ${sizeStyle[size]}
          ${variantStyle[variant]}
        `}
      >
        <ControlKeyLabel />
        <span
          css={css`
            white-space: nowrap;
            font-size: 0.8em;
            margin: 0 2px;
          `}
        >
          +
        </span>
        {hotkey}
      </Typography>
    </div>
  )
}

export default HotkeyLabel
