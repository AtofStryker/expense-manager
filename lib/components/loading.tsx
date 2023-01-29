import { SerializedStyles, css, keyframes } from '@emotion/react'
import { Typography } from '@mui/material'
import Image from 'next/image'

// TODO: Split this file into multiple component

export interface LoadingProps {
  size: number
  cssOverrides?: {
    image?: SerializedStyles
    text?: SerializedStyles
  }
  text?: string
}

export interface LoadingScreenProps extends Omit<LoadingProps, 'size'> {
  size?: number
  cssOverrides?: {
    image: SerializedStyles
    text: SerializedStyles
  }
  text?: string
}

// Unfortunately, we need to use custom formatting for keyframes. See:
// https://github.com/prettier/prettier/issues/13774.
const coinRotation = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(1440deg); // 4 spins (360 degrees * 4)
  }
`

export const Loading: React.FC<LoadingProps> = ({ cssOverrides, text, size }) => {
  return (
    <>
      <Image
        src="/static/coin.svg"
        priority
        width={size}
        height={size}
        alt="rotating coin loading image"
        css={css`
          // https://github.com/mui-org/material-ui/issues/13793#issuecomment-512202238
          animation: ${coinRotation} 2s infinite ease-in-out;
          display: block;
          margin-left: auto;
          margin-right: auto;
          width: ${size}px;
          height: ${size}px;
          ${cssOverrides?.image}
        `}
      />
      {text && (
        <Typography
          variant="h3"
          gutterBottom
          css={css`
            text-align: center;
            ${cssOverrides?.text}
          `}
        >
          {text}
        </Typography>
      )}
    </>
  )
}

export const LoadingScreen = (props?: LoadingScreenProps) => (
  <Loading
    cssOverrides={{
      image: css`
        margin-top: 20vh;
        width: clamp(15px, 45vw, 35vh);
      `,
      text: css`
        margin-top: 10vh;
      `,
    }}
    // TODO: Remove size prop, we need to use cssOverrides instead as it's more expressive (we can clam the size based
    // on the screen size)
    size={0}
    text="Loading..."
    {...props}
  />
)

export const LoadingOverlay = () => {
  return (
    <div
      css={css`
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        display: flex;
        background-color: rgba(0, 0, 0, 0.4);
      `}
    >
      <Loading size={150} />
    </div>
  )
}

export default Loading
