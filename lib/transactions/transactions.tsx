import { css } from '@emotion/react'
import { Theme } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import ConfirmDialog from '../components/confirmDialog'
import PageWrapper from '../components/pageWrapper'
import Paper from '../components/paper'
import SearchBar from '../components/searchBar'
import { COMMANDS } from '../search/transactionSearch'
import { BACKGROUND_COLOR } from '../shared/constants'
import { useKeyDownAction } from '../shared/hooks'

import { changeTxSearchQuery, keyPressAction, removeTx, setConfirmTxDeleteDialogOpen } from './actions'
import {
  applySearchOnTransactions,
  isValidQuerySel,
  txSearchQuerySel,
  valueOptionsSel,
  confirmDeleteDialogForTxSel,
} from './selectors'
import { TransactionContent } from './transaction'
import TransactionList from './transactionList'

const useStyles = makeStyles()((theme: Theme) => ({
  searchBar: { marginBottom: theme.spacing(2) },
}))

const Transactions = () => {
  const txSearchQuery = useSelector(txSearchQuerySel)
  const transactions = useSelector(applySearchOnTransactions)
  const isValidQuery = useSelector(isValidQuerySel)
  const valueOptions = useSelector(valueOptionsSel)
  const { classes } = useStyles()
  const dispatch = useDispatch()
  const confirmDeleteDialogForTx = useSelector(confirmDeleteDialogForTxSel)

  useKeyDownAction((e: KeyboardEvent) => {
    const tagName = document.activeElement?.tagName
    // only dispatch if the active element is not a search bar or code editor
    if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
      dispatch(keyPressAction(e))
    }
  })

  return (
    <PageWrapper>
      <SearchBar
        className={classes.searchBar}
        commands={COMMANDS.map((c) => c.name)}
        placeholder="Search transactions"
        onQueryChange={(newQuery) => dispatch(changeTxSearchQuery(newQuery))}
        query={txSearchQuery}
        isValidQuery={isValidQuery}
        valueOptions={valueOptions}
      />

      <Paper listContainer>
        <TransactionList transactions={transactions} />
      </Paper>

      <ConfirmDialog
        ContentComponent={
          <>
            <p>Do you really want to remove the following transaction?</p>
            <div
              css={css`
                background-color: ${BACKGROUND_COLOR};
              `}
            >
              <div
                css={css`
                  transform: scale(0.7);
                  background-color: white;
                  padding: 16px;
                  border-radius: 8px;
                `}
              >
                <TransactionContent tx={confirmDeleteDialogForTx!} bigDevice={true} />
              </div>
            </div>
            <i>
              <b>This action can't be undone!</b>
            </i>
          </>
        }
        open={confirmDeleteDialogForTx !== null}
        onCancel={() => dispatch(setConfirmTxDeleteDialogOpen(null))}
        onConfirm={(e) => {
          e.stopPropagation()

          dispatch(setConfirmTxDeleteDialogOpen(null))
          dispatch(removeTx(confirmDeleteDialogForTx!.id))
        }}
      />
    </PageWrapper>
  )
}

export default Transactions
