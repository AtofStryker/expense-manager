import { css } from '@emotion/react'
import { Typography, styled, ContainerProps } from '@mui/material'
import ParentSize from '@visx/responsive/lib/components/ParentSize'

import Paper from '../components/paper'

const ChartContainer = styled(Paper)(({ theme }) => ({
  height: '300px',
  width: '100%',
  '&:not(:last-child)': {
    marginBottom: theme.spacing(2),
  },
}))

interface Props extends ContainerProps {
  label?: string
  renderChart: (props: { width: number; height: number }) => React.ReactNode
  as?: React.ElementType
}

const ChartWrapper: React.FunctionComponent<Props> = ({ label, renderChart, as, ...containerProps }) => {
  return (
    <ChartContainer as={as} {...containerProps}>
      <Typography
        variant="overline"
        display="block"
        css={css`
          text-align: center;
          margin-bottom: -25px;
          letter-spacing: 0.08em;
        `}
      >
        {label}
      </Typography>
      <ParentSize>{renderChart}</ParentSize>
    </ChartContainer>
  )
}

export default ChartWrapper
