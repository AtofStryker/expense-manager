import Button from '@material-ui/core/Button'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import React from 'react'

import { LoadingScreen } from '../components/loading'
import Navigation from '../components/navigation'
import firebase from '../firebase/firebase'
import { useRedirectIfNotSignedIn } from '../shared/hooks'

function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut()
}

type SettingsPanel = 'none' | 'importExport'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    importExportContent: {
      flexDirection: 'column',
    },
    importExportButton: {
      marginBottom: theme.spacing(1),
    },
  }),
)

const Settings = () => {
  const classes = useStyles()
  const [expanded, setExpanded] = React.useState<SettingsPanel>('none')
  const togglePanel = (panel: SettingsPanel) => () => {
    if (expanded === panel) {
      setExpanded('none')
    } else {
      setExpanded(panel)
    }
  }

  if (useRedirectIfNotSignedIn() !== 'loggedIn') {
    return <LoadingScreen />
  } else {
    return (
      <>
        <Navigation />
        <div className={classes.root}>
          settings
          <button onClick={signOut} aria-label="sign out">
            google sign out
          </button>
          <ExpansionPanel
            expanded={expanded === 'importExport'}
            onChange={togglePanel('importExport')}
            aria-label="import export expansion"
          >
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="importExportExpansion-content"
            >
              <Typography>Import and export</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.importExportContent}>
              <input
                id="choose-import-file"
                type="file"
                style={{ display: 'none' }}
              />
              <label htmlFor="choose-import-file">
                <Button
                  variant="contained"
                  className={classes.importExportButton}
                  fullWidth
                  color="primary"
                  aria-label="import from file"
                  component="span"
                >
                  Import from file
                </Button>
              </label>

              <Button
                variant="contained"
                className={classes.importExportButton}
                fullWidth
                color="secondary"
              >
                Export to file
              </Button>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </div>
      </>
    )
  }
}

export default Settings