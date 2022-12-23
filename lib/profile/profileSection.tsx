import { useState } from 'react'

import { css } from '@emotion/react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()({
  importExportContent: {
    flexDirection: 'column',
  },
})

export interface ProfileSectionProps {
  name: string
  children: React.ReactNode
}

const ProfileSection: React.FunctionComponent<ProfileSectionProps> = (props) => {
  const { classes } = useStyles()
  const [expanded, setExpanded] = useState(false)

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      aria-label={props.name}
      css={css`
        text-transform: capitalize;
      `}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{props.name}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.importExportContent}>{props.children}</AccordionDetails>
    </Accordion>
  )
}

export default ProfileSection
