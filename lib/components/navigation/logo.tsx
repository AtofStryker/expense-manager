import { css } from '@emotion/react'
import { Tooltip } from '@mui/material'
import Image from 'next/image'
import Router from 'next/router'

import { useIsVeryBigDevice } from '../../shared/hooks'

const ExpenseManagerLogo = () => {
  const isVeryBigDevice = useIsVeryBigDevice()

  const onLogoClick = () => {
    Router.reload()
  }

  if (!isVeryBigDevice) return null
  return (
    <Tooltip title="Reload">
      <Image
        width={40}
        height={40}
        src="/static/coin.svg"
        priority
        alt="coin"
        onClick={onLogoClick}
        css={css(`
        cursor: pointer;
      `)}
      />
    </Tooltip>
  )
}

export default ExpenseManagerLogo
