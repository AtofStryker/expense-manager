import { useState } from 'react'

import { css } from '@emotion/react'
import LogoutIcon from '@mui/icons-material/ExitToApp'
import { Alert, Theme, Typography, Button } from '@mui/material'
import { getAuth } from 'firebase/auth'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import ConfirmDialog from '../components/confirmDialog'
import CurrencySelect from '../components/currencySelect'
import Loading from '../components/loading'
import PageWrapper from '../components/pageWrapper'
import { settingsSel, signInStatusSel, transactionsSel } from '../shared/selectors'

import {
  clearAllData,
  exportToCSV,
  importFromCSV,
  exportToJSON,
  importFromJSON,
  changeDefaultCurrency,
  changeMainCurrency,
} from './actions'
import BackupFiles from './backupFiles'
import SettingsPanel from './profileSection'

const useStyles = makeStyles()((theme: Theme) => ({
  marginBottom: {
    marginBottom: theme.spacing(1),
  },
  signOutButton: {
    marginTop: theme.spacing(2),
  },
}))

const Profile = () => {
  const { classes } = useStyles()
  const dispatch = useDispatch()
  const [deleteAllDataDialogOpen, setDeleteAllDataDialogOpen] = useState(false)
  const settings = useSelector(settingsSel)
  const signInStatus = useSelector(signInStatusSel)
  const txs = useSelector(transactionsSel)

  return (
    <PageWrapper>
      <SettingsPanel name="settings">
        {!settings && <Loading size={20} />}
        {settings && (
          <>
            {/* only support changing main currency if there are no transactions yet. */}
            {signInStatus === 'loggedIn' && Object.values(txs).length === 0 && (
              <CurrencySelect
                value={settings.mainCurrency}
                onChange={(curr) => dispatch(changeMainCurrency(curr))}
                label="Main currency"
                className={classes.marginBottom}
              />
            )}
            <CurrencySelect
              value={settings.defaultCurrency}
              onChange={(curr) => dispatch(changeDefaultCurrency(curr))}
              label="Default currency"
            />
          </>
        )}
      </SettingsPanel>

      <SettingsPanel name="import and export">
        <Typography
          variant="subtitle2"
          gutterBottom
          css={css`
            text-transform: initial;
          `}
        >
          JSON
        </Typography>
        <input
          id="choose-json-file"
          type="file"
          css={css`
            display: none;
          `}
          onChange={(e) => dispatch(importFromJSON(e))}
        />
        <label htmlFor="choose-json-file">
          <Button
            variant="contained"
            className={classes.marginBottom}
            fullWidth
            color="primary"
            aria-label="import from json"
            component="span"
          >
            Import from json
          </Button>
        </label>

        <Button
          variant="contained"
          className={classes.marginBottom}
          fullWidth
          color="primary"
          aria-label="export to json"
          onClick={() => dispatch(exportToJSON())}
        >
          Export to json
        </Button>

        <Typography
          variant="subtitle2"
          gutterBottom
          css={css`
            text-transform: initial;
          `}
        >
          CSV
        </Typography>
        <Alert
          severity="warning"
          css={css`
            margin-bottom: 8px;
            text-transform: initial;
          `}
        >
          Exporting to CSV discards some internal information. Use this format only when you want to view the data in
          another tool (e.g. excel). For backups, prefer using the <b>JSON format</b>.
        </Alert>
        <input
          id="choose-csv-file"
          type="file"
          css={css`
            display: none;
          `}
          onChange={(e) => dispatch(importFromCSV(e))}
        />
        <label htmlFor="choose-csv-file">
          <Button
            variant="contained"
            className={classes.marginBottom}
            fullWidth
            color="primary"
            aria-label="import from csv"
            component="span"
          >
            Import from csv
          </Button>
        </label>

        <Button
          variant="contained"
          className={classes.marginBottom}
          fullWidth
          color="primary"
          aria-label="export to csv"
          onClick={() => dispatch(exportToCSV())}
        >
          Export to csv
        </Button>
      </SettingsPanel>

      <SettingsPanel name="backup">
        <BackupFiles />
      </SettingsPanel>

      <SettingsPanel name="clear data">
        <Button
          variant="contained"
          className={classes.marginBottom}
          fullWidth
          color="secondary"
          aria-label="clear data"
          onClick={() => setDeleteAllDataDialogOpen(true)}
        >
          Clear all expense manager data
        </Button>
      </SettingsPanel>

      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          getAuth().signOut()
        }}
        aria-label="sign out"
        className={classes.signOutButton}
        startIcon={<LogoutIcon />}
      >
        Sign out
      </Button>

      <ConfirmDialog
        open={deleteAllDataDialogOpen}
        onConfirm={() => {
          dispatch(clearAllData())
          setDeleteAllDataDialogOpen(false)
        }}
        onCancel={() => setDeleteAllDataDialogOpen(false)}
        title="Clear all user data"
        ContentComponent={
          <>
            <p>Are you sure you want to clear all expense manager data?</p>
            <b>You will not be able to revert this action!</b>
          </>
        }
      />
    </PageWrapper>
  )
}

export default Profile
