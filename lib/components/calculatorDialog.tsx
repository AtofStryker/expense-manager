import { Button, Dialog, DialogActions, DialogContent, TextField } from '@mui/material'
import { create as createMath, all as allMathFunctions } from 'mathjs'

import { round } from '../shared/utils'

const math = createMath(allMathFunctions)

interface CalculatorDialogProps {
  setShowCalc: (open: boolean) => void
  showCalc: boolean
  calcExpression: string
  setCalcExpression: (exp: string) => void
  setAmount: (amount: string) => void
}

// TODO: Round based on the decimal points of a currency
function formatAmount(amount: number | null) {
  return amount ? round(amount, 2).toString() : ''
}

const CalculatorDialog = ({
  calcExpression,
  setCalcExpression,
  setShowCalc,
  showCalc,
  setAmount,
}: CalculatorDialogProps) => {
  let exprResult: number | null
  try {
    exprResult = math.evaluate(calcExpression)
  } catch {
    exprResult = null
  }

  const onOk = () => {
    setAmount(formatAmount(exprResult))
    setShowCalc(false)
  }

  return (
    <Dialog
      onClose={() => setShowCalc(false)}
      aria-labelledby="simple-dialog-title"
      disableEnforceFocus
      TransitionProps={{
        onEntered: () => document.getElementById('calculator-textfield')?.focus(),
      }}
      open={showCalc}
    >
      <DialogContent>
        <TextField
          id="calculator-textfield"
          autoFocus
          // We want the input mode to be "text" because we also want to be able to write math symbols (e.g. `+`) and
          // the "numeric" only shows numbers on iPhone keyboards.
          inputProps={{ inputMode: 'text' }}
          fullWidth
          error={exprResult === null}
          label="Expression"
          value={calcExpression}
          onChange={(e) => setCalcExpression(e.target.value)}
          helperText={exprResult === null ? 'Malformed expression' : `Result: ${formatAmount(exprResult)}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOk()
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCalc(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={onOk} color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalculatorDialog
